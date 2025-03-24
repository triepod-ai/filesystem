import { readFile, writeFile } from './filesystem.js';
import { logInfo, logError, logWarning } from '../logger.js';

type SearchReplacePair = {
  search: string;
  replace: string;
};

/**
 * Parse an edit block into file path and search/replace pairs
 */
export async function parseEditBlock(content: string): Promise<{ filePath: string, searchReplace: SearchReplacePair[] }> {
  // First line should be the file path
  const lines = content.split('\n');
  
  if (lines.length === 0) {
    throw new Error('Edit block is empty');
  }
  
  const filePath = lines[0].trim();
  
  if (!filePath) {
    throw new Error('File path is missing in edit block');
  }
  
  const searchReplacePattern = /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g;
  const searchReplace: SearchReplacePair[] = [];
  
  let match;
  while ((match = searchReplacePattern.exec(content)) !== null) {
    const search = match[1];
    const replace = match[2];
    
    if (!search || !replace) {
      logWarning('Empty search or replace pattern found in edit block');
    }
    
    searchReplace.push({ search, replace });
  }
  
  if (searchReplace.length === 0) {
    throw new Error('No valid search/replace pairs found in edit block');
  }
  
  return { filePath, searchReplace };
}

/**
 * Apply search and replace operations to a file
 */
export async function performSearchReplace(filePath: string, searchReplacePairs: SearchReplacePair[]): Promise<void> {
  try {
    // Read the file content
    logInfo(`Reading file for edit: ${filePath}`);
    let fileContent = await readFile(filePath);
    
    // Keep track of whether any changes were made
    let changesMade = false;
    
    // Apply each search/replace pair
    for (const { search, replace } of searchReplacePairs) {
      if (!fileContent.includes(search)) {
        logWarning(`Search pattern not found in file: ${filePath}`);
        logWarning(`Search pattern (first 50 chars): ${search.substring(0, 50)}...`);
        continue;
      }
      
      fileContent = fileContent.replace(search, replace);
      changesMade = true;
      
      logInfo('Applied search/replace operation');
    }
    
    if (!changesMade) {
      throw new Error('No changes were made to the file. Search patterns may not match exactly.');
    }
    
    // Write the updated content back to the file
    logInfo(`Writing edited file: ${filePath}`);
    await writeFile(filePath, fileContent);
    
  } catch (error) {
    logError(`Error performing search/replace on ${filePath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error editing file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
