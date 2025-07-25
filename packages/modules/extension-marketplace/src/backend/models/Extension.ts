/* tslint:disable */
/* eslint-disable */
/**
 * Extension Config API
 * API to submit and publish an ExtensionConfig object
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface Extension
 */
export interface Extension {
    /**
     * 
     * @type {boolean}
     * @memberof Extension
     */
    isDownloaded?: boolean;
    /**
     * 
     * @type {string}
     * @memberof Extension
     */
    userName: string;
    /**
     * 
     * @type {string}
     * @memberof Extension
     */
    userId: string;
    /**
     * 
     * @type {boolean}
     * @memberof Extension
     */
    hasIcon?: boolean;
    /**
     * this is a unique name of the package. On extension config, it is set to kebab-case of user's set name
     * @type {string}
     * @memberof Extension
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof Extension
     */
    config: string;
    /**
     * 
     * @type {string}
     * @memberof Extension
     */
    packageJson: string;
    /**
     * 
     * @type {number}
     * @memberof Extension
     */
    id?: number;
    /**
     * 
     * @type {boolean}
     * @memberof Extension
     */
    isPublished?: boolean;
}

/**
 * Check if a given object implements the Extension interface.
 */
export function instanceOfExtension(value: object): value is Extension {
    if (!('userName' in value) || value['userName'] === undefined) return false;
    if (!('userId' in value) || value['userId'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('config' in value) || value['config'] === undefined) return false;
    if (!('packageJson' in value) || value['packageJson'] === undefined) return false;
    return true;
}

export function ExtensionFromJSON(json: any): Extension {
    return ExtensionFromJSONTyped(json, false);
}

export function ExtensionFromJSONTyped(json: any, ignoreDiscriminator: boolean): Extension {
    if (json == null) {
        return json;
    }
    return {
        
        'isDownloaded': json['isDownloaded'] == null ? undefined : json['isDownloaded'],
        'userName': json['userName'],
        'userId': json['userId'],
        'hasIcon': json['hasIcon'] == null ? undefined : json['hasIcon'],
        'name': json['name'],
        'config': json['config'],
        'packageJson': json['packageJson'],
        'id': json['id'] == null ? undefined : json['id'],
        'isPublished': json['isPublished'] == null ? undefined : json['isPublished'],
    };
}

export function ExtensionToJSON(json: any): Extension {
    return ExtensionToJSONTyped(json, false);
}

export function ExtensionToJSONTyped(value?: Extension | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'isDownloaded': value['isDownloaded'],
        'userName': value['userName'],
        'userId': value['userId'],
        'hasIcon': value['hasIcon'],
        'name': value['name'],
        'config': value['config'],
        'packageJson': value['packageJson'],
        'id': value['id'],
        'isPublished': value['isPublished'],
    };
}

