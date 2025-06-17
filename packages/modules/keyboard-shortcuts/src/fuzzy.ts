import Fuse, {
  FuseOptionKey,
  FuseResult,
  FuseResultMatch,
  RangeTuple,
} from 'fuse.js';
import { html, TemplateResult } from 'lit';
import { TemplateLiteral } from 'typescript';

export const renderMatches = <T, S extends FuseOptionKey<T>[] | undefined>(
  list: T[],
  keys: S,
  pattern: string
): FuseResult<T>[] => {
  return new Fuse(list, {
    keys: keys,
    includeMatches: true,
    includeScore: true,
    threshold: 0.2,
    shouldSort: true,
  })
    .search(pattern)
    .map((match: FuseResult<T>) => {
      return {
        item: match.item,
        matches: match.matches?.map((singleMatch: FuseResultMatch) => {
          let newOutput = [];
          for (let i = 0; i < singleMatch.value.length; i++) {
            let foundMatch = false;
            singleMatch.indices.forEach((tuple: RangeTuple) => {
              if (i >= tuple[0] && i <= tuple[1]) {
                newOutput.push(html`<b>${singleMatch.value[i]}</b>`);
                foundMatch = true;
              }
            });

            if (!foundMatch) {
              newOutput.push(singleMatch.value[i]);
            }
          }
          return newOutput;
        }),
      };
    });
};
