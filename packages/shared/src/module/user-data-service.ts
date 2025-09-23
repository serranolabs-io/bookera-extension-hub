// UserDataService - Clean data persistence with multi-instance sync 🔥
import { BagManager, CreateBagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import type { SupabaseClient } from '@supabase/supabase-js';

// The service interface - clean and simple
export interface UserDataService<TData = unknown> {
  get(moduleId: string, key?: string): Promise<TData | undefined>;
  set(moduleId: string, data: TData, key?: string): Promise<void>;
  update(moduleId: string, updates: Partial<TData>, key?: string): Promise<void>;
  delete(moduleId: string, key?: string): Promise<void>;
  list(moduleId: string): Promise<TData[]>;
  subscribe(moduleId: string, callback: (data: TData) => void): () => void;
  
  // Draft state management - for work-in-progress data
  getDraft(moduleId: string, draftId: string): Promise<TData | undefined>;
  setDraft(moduleId: string, draftId: string, data: TData): Promise<void>;
  updateDraft(moduleId: string, draftId: string, updates: Partial<TData>): Promise<void>;
  deleteDraft(moduleId: string, draftId: string): Promise<void>;
  listDrafts(moduleId: string): Promise<Array<{ id: string; data: TData; lastModified: Date }>>;
  publishDraft(moduleId: string, draftId: string, key?: string): Promise<void>;
}

// Cross-instance sync via Saddlebag - no DOM events needed
export interface UserDataSyncEvent<TData = unknown> {
  moduleId: string;
  key?: string;
  data: TData;
  lastModified: Date;
  version: number;
  deviceId: string;
}

// The actual service implementation
export class HybridUserDataService<TData = unknown> implements UserDataService<TData> {
  private bagManager: BagManager;
  private syncBag: any; // Global sync bag for cross-instance communication
  private subscribers = new Map<string, Set<(data: TData) => void>>();
  private deviceId = crypto.randomUUID();

  constructor(
    private supabaseClient?: SupabaseClient,
    private userId?: string
  ) {
    this.bagManager = CreateBagManager(true);
    this.setupSaddlebagSync();
  }

  // Setup cross-instance sync via Saddlebag - no DOM events needed
  private setupSaddlebagSync(): void {
    // Use a shared bag for cross-instance sync
    this.syncBag = this.bagManager.createBag('user-data-sync');
    
    // Listen for changes from other instances
    this.syncBag.onAllChanges((syncEvent: UserDataSyncEvent<TData>) => {
      if (!syncEvent || syncEvent.deviceId === this.deviceId) {
        return; // Don't process our own events
      }
      
      // Update local state from remote changes
      this.updateLocalState(syncEvent.moduleId, syncEvent.data, syncEvent.key);
      
      // Notify subscribers
      this.notifySubscribers(syncEvent.moduleId, syncEvent.data);
    });
  }

  // Broadcast data changes via Saddlebag global bag
  private broadcastSync(moduleId: string, data: TData, key?: string): void {
    const syncEvent: UserDataSyncEvent<TData> = {
      moduleId,
      key,
      data,
      lastModified: new Date(),
      version: Date.now(), // Simple version using timestamp
      deviceId: this.deviceId
    };
    
    const syncKey = `${moduleId}${key ? `-${key}` : ''}`;
    this.syncBag.set(syncKey, syncEvent);
  }

  // Update local Saddlebag state without triggering events
  private updateLocalState(moduleId: string, data: TData, key?: string): void {
    const storageKey = this.getStorageKey(moduleId, key);
    const bag = this.bagManager.getBag(storageKey) || this.bagManager.createBag(storageKey);
    if (bag) {
      bag.set('data', data);
    }
  }

  // Generate consistent storage keys
  private getStorageKey(moduleId: string, key?: string): string {
    return `user-data-${moduleId}${key ? `-${key}` : ''}`;
  }

  // Generate draft storage keys
  private getDraftStorageKey(moduleId: string, draftId: string): string {
    return `user-data-draft-${moduleId}-${draftId}`;
  }

  // Notify all subscribers for a module
  private notifySubscribers(moduleId: string, data: TData): void {
    const moduleSubscribers = this.subscribers.get(moduleId);
    if (moduleSubscribers) {
      moduleSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in UserDataService subscriber for ${moduleId}:`, error);
        }
      });
    }
  }

  // Get data from local first, fallback to remote
  async get(moduleId: string, key?: string): Promise<TData | undefined> {
    const storageKey = this.getStorageKey(moduleId, key);
    
    // Try Saddlebag first (fastest)
    const bag = this.bagManager.getBag(storageKey);
    let data = bag?.get('data') as TData | undefined;
    
    if (data) {
      return data;
    }
    
    // Try LocalForage (local persistence)
    try {
      data = await localforage.getItem<TData>(storageKey) as TData | undefined;
      if (data) {
        // Cache in Saddlebag for next time
        const newBag = this.bagManager.createBag(storageKey);
        if (newBag) {
          newBag.set('data', data);
        }
        return data;
      }
    } catch (error) {
      console.warn(`LocalForage error for ${storageKey}:`, error);
    }
    
    // Try Supabase (remote)
    if (this.supabaseClient && this.userId) {
      try {
        const { data: remoteData, error } = await this.supabaseClient
          .from('user_module_data')
          .select('data')
          .eq('user_id', this.userId)
          .eq('module_id', moduleId)
          .eq('key', key || 'default')
          .single();
          
        if (!error && remoteData?.data) {
          // Cache locally for next time
          await localforage.setItem(storageKey, remoteData.data);
          const newBag = this.bagManager.createBag(storageKey);
          if (newBag) {
            newBag.set('data', remoteData.data);
          }
          return remoteData.data;
        }
      } catch (error) {
        console.warn(`Supabase error for ${storageKey}:`, error);
      }
    }
    
    return undefined;
  }

  // Set data with multi-layer persistence and sync
  async set(moduleId: string, data: TData, key?: string): Promise<void> {
    const storageKey = this.getStorageKey(moduleId, key);
    
    // Update Saddlebag (reactive state)
    const bag = this.bagManager.getBag(storageKey) || this.bagManager.createBag(storageKey);
    if (bag) {
      bag.set('data', data);
    }
    
    // Broadcast to other instances via Saddlebag sync
    this.broadcastSync(moduleId, data, key);
    
    // Update LocalForage (local persistence) with proper error handling
    try {
      await localforage.setItem(storageKey, data);
    } catch (error) {
      console.error(`LocalForage persistence failed for ${storageKey}:`, error);
      // Could implement retry queue here
    }
    
    // Update Supabase (remote sync) with proper error handling
    if (this.supabaseClient && this.userId) {
      try {
        const { error } = await this.supabaseClient
          .from('user_module_data')
          .upsert({
            user_id: this.userId,
            module_id: moduleId,
            key: key || 'default',
            data: data,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error(`Supabase sync failed for ${storageKey}:`, error);
          // Could implement retry queue here
        }
      } catch (error) {
        console.error(`Supabase sync error for ${storageKey}:`, error);
      }
    }
    
    // Notify local subscribers
    this.notifySubscribers(moduleId, data);
  }

  // Update partial data
  async update(moduleId: string, updates: Partial<TData>, key?: string): Promise<void> {
    const currentData = await this.get(moduleId, key);
    const updatedData = { ...currentData, ...updates } as TData;
    await this.set(moduleId, updatedData, key);
  }

  // Delete data
  async delete(moduleId: string, key?: string): Promise<void> {
    const storageKey = this.getStorageKey(moduleId, key);
    
    // Remove from Saddlebag
    const bag = this.bagManager.getBag(storageKey);
    if (bag) {
      bag.set('data', undefined);
    }
    
    // Remove from LocalForage
    try {
      await localforage.removeItem(storageKey);
    } catch (error) {
      console.error(`LocalForage delete error for ${storageKey}:`, error);
    }
    
    // Remove from Supabase
    if (this.supabaseClient && this.userId) {
      this.supabaseClient
        .from('user_module_data')
        .delete()
        .eq('user_id', this.userId)
        .eq('module_id', moduleId)
        .eq('key', key || 'default')
        .then(({ error }) => {
          if (error) {
            console.error(`Supabase delete error for ${storageKey}:`, error);
          }
        });
    }
    
    // Broadcast deletion to other instances via Saddlebag
    this.broadcastSync(moduleId, undefined as any, key);
  }

  // List all data for a module (useful for extensions)
  async list(moduleId: string): Promise<TData[]> {
    if (!this.supabaseClient || !this.userId) {
      // Fallback to local data only
      const results: TData[] = [];
      const keys = await localforage.keys();
      const moduleKeys = keys.filter(k => k.startsWith(`user-data-${moduleId}-`));
      
      for (const key of moduleKeys) {
        const data = await localforage.getItem<TData>(key);
        if (data) results.push(data);
      }
      
      return results;
    }
    
    try {
      const { data, error } = await this.supabaseClient
        .from('user_module_data')
        .select('data')
        .eq('user_id', this.userId)
        .eq('module_id', moduleId);
        
      if (error) throw error;
      
      return data?.map(item => item.data) || [];
    } catch (error) {
      console.error(`List error for module ${moduleId}:`, error);
      return [];
    }
  }

  // Subscribe to data changes for real-time updates
  subscribe(moduleId: string, callback: (data: TData) => void): () => void {
    // Add to local subscribers
    if (!this.subscribers.has(moduleId)) {
      this.subscribers.set(moduleId, new Set());
    }
    this.subscribers.get(moduleId)!.add(callback);
    
    // Setup Saddlebag listener for this module's data bag
    const storageKey = this.getStorageKey(moduleId);
    const bag = this.bagManager.getBag(storageKey) || this.bagManager.createBag(storageKey);
    
    if (bag) {
      const listener = () => {
        const data = bag.get('data') as TData;
        if (data) callback(data);
      };
      
      bag.onAllChanges(listener);
    }
    
    // Return unsubscribe function
    return () => {
      // Remove from subscribers
      const moduleSubscribers = this.subscribers.get(moduleId);
      if (moduleSubscribers) {
        moduleSubscribers.delete(callback);
        if (moduleSubscribers.size === 0) {
          this.subscribers.delete(moduleId);
        }
      }
      
      // Note: Saddlebag doesn't have explicit removeListener, 
      // but listeners are cleaned up when bags are disposed
    };
  }

  // Setup Supabase realtime subscriptions for cross-device sync
  setupRealtimeSync(moduleId: string): () => void {
    if (!this.supabaseClient || !this.userId) {
      console.warn('Cannot setup realtime sync without Supabase client and user ID');
      return () => {};
    }
    
    const subscription = this.supabaseClient
      .channel(`user-data-${this.userId}-${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_data',
          filter: `user_id=eq.${this.userId} AND module_id=eq.${moduleId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { module_id, key, data } = payload.new as any;
            
            // Update local state
            this.updateLocalState(module_id, data, key);
            
            // Broadcast to other instances via Saddlebag
            this.broadcastSync(module_id, data, key);
            
            // Notify subscribers
            this.notifySubscribers(module_id, data);
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }

  // DRAFT STATE METHODS - for work-in-progress data
  
  // Get draft data (local only - drafts don't sync until published)
  async getDraft(moduleId: string, draftId: string): Promise<TData | undefined> {
    const storageKey = this.getDraftStorageKey(moduleId, draftId);
    
    // Try Saddlebag first
    const bag = this.bagManager.getBag(storageKey);
    let data = bag?.get('data') as TData | undefined;
    
    if (data) {
      return data;
    }
    
    // Try LocalForage
    try {
      const localData = await localforage.getItem<TData>(storageKey);
      if (localData) {
        // Cache in Saddlebag
        const newBag = this.bagManager.createBag(storageKey);
        if (newBag) {
          newBag.set('data', localData);
        }
        return localData;
      }
    } catch (error) {
      console.warn(`LocalForage draft error for ${storageKey}:`, error);
    }
    
    return undefined;
  }

  // Set draft data (local only + auto-save)
  async setDraft(moduleId: string, draftId: string, data: TData): Promise<void> {
    const storageKey = this.getDraftStorageKey(moduleId, draftId);
    
    // Update Saddlebag immediately for responsiveness
    const bag = this.bagManager.getBag(storageKey) || this.bagManager.createBag(storageKey);
    bag?.set('data', data);
    bag?.set('lastModified', new Date());
    
    // Auto-save to LocalForage (fire and forget)
    localforage.setItem(storageKey, {
      data,
      lastModified: new Date(),
      draftId
    }).catch(error => {
      console.error(`Draft auto-save error for ${storageKey}:`, error);
    });
    
    // NOTE: Drafts don't broadcast to other instances until published
    // This prevents work-in-progress from interfering across multiple editors
  }

  // Update draft data (partial updates with auto-save)
  async updateDraft(moduleId: string, draftId: string, updates: Partial<TData>): Promise<void> {
    const currentDraft = await this.getDraft(moduleId, draftId);
    const updatedData = { ...currentDraft, ...updates } as TData;
    await this.setDraft(moduleId, draftId, updatedData);
  }

  // Delete draft data
  async deleteDraft(moduleId: string, draftId: string): Promise<void> {
    const storageKey = this.getDraftStorageKey(moduleId, draftId);
    
    // Remove from Saddlebag
    const bag = this.bagManager.getBag(storageKey);
    if (bag) {
      bag.set('data', undefined);
      bag.set('lastModified', undefined);
      bag.set('draftId', undefined);
    }
    
    // Remove from LocalForage
    try {
      await localforage.removeItem(storageKey);
    } catch (error) {
      console.error(`Draft delete error for ${storageKey}:`, error);
    }
  }

  // List all drafts for a module
  async listDrafts(moduleId: string): Promise<Array<{ id: string; data: TData; lastModified: Date }>> {
    const results: Array<{ id: string; data: TData; lastModified: Date }> = [];
    
    try {
      const keys = await localforage.keys();
      const draftKeys = keys.filter(k => k.startsWith(`user-data-draft-${moduleId}-`));
      
      for (const key of draftKeys) {
        const draftData = await localforage.getItem<{
          data: TData;
          lastModified: Date;
          draftId: string;
        }>(key);
        
        if (draftData) {
          results.push({
            id: draftData.draftId,
            data: draftData.data,
            lastModified: new Date(draftData.lastModified)
          });
        }
      }
    } catch (error) {
      console.error(`List drafts error for module ${moduleId}:`, error);
    }
    
    return results.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  // Publish draft - move from draft state to published state
  async publishDraft(moduleId: string, draftId: string, key?: string): Promise<void> {
    const draftData = await this.getDraft(moduleId, draftId);
    
    if (!draftData) {
      throw new Error(`Draft ${draftId} not found for module ${moduleId}`);
    }
    
    // Publish the draft data using normal set() - this will sync everywhere
    await this.set(moduleId, draftData, key);
    
    // Clean up the draft
    await this.deleteDraft(moduleId, draftId);
  }
}

// Simple factory for dependency injection - no singleton bullshit
export class UserDataServiceFactory {
  constructor(
    private defaultSupabaseClient?: SupabaseClient,
    private defaultUserId?: string
  ) {}

  create<TData = unknown>(
    supabaseClient?: SupabaseClient,
    userId?: string
  ): UserDataService<TData> {
    return new HybridUserDataService<TData>(
      supabaseClient || this.defaultSupabaseClient,
      userId || this.defaultUserId
    );
  }
}

// Helper function for simple cases - creates new instance every time
export function createUserDataService<TData = unknown>(
  supabaseClient?: SupabaseClient,
  userId?: string
): UserDataService<TData> {
  return new HybridUserDataService<TData>(supabaseClient, userId);
}