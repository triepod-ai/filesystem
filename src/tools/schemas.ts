import { z } from 'zod';

// Terminal execution schemas
export const ExecuteCommandArgsSchema = z.object({
  command: z.string().min(1).describe('The command to execute'),
  timeout: z.number().optional().describe('Timeout in milliseconds before returning initial output')
});

export const ReadOutputArgsSchema = z.object({
  pid: z.number().int().positive().describe('The process ID to read output from')
});

export const ForceTerminateArgsSchema = z.object({
  pid: z.number().int().positive().describe('The process ID to terminate')
});

export const ListSessionsArgsSchema = z.object({});

export const KillProcessArgsSchema = z.object({
  pid: z.number().int().positive().describe('The process ID to kill')
});

export const BlockCommandArgsSchema = z.object({
  command: z.string().min(1).describe('The command pattern to block')
});

export const UnblockCommandArgsSchema = z.object({
  command: z.string().min(1).describe('The command pattern to unblock')
});

// Filesystem schemas
export const ReadFileArgsSchema = z.object({
  path: z.string().min(1).describe('The path of the file to read')
});

export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).describe('The paths of the files to read')
});

export const WriteFileArgsSchema = z.object({
  path: z.string().min(1).describe('The path of the file to write to'),
  content: z.string().describe('The content to write to the file')
});

export const CreateDirectoryArgsSchema = z.object({
  path: z.string().min(1).describe('The path of the directory to create')
});

export const ListDirectoryArgsSchema = z.object({
  path: z.string().min(1).describe('The path of the directory to list')
});

export const MoveFileArgsSchema = z.object({
  source: z.string().min(1).describe('The source path'),
  destination: z.string().min(1).describe('The destination path')
});

export const SearchFilesArgsSchema = z.object({
  path: z.string().min(1).describe('The path to search in'),
  pattern: z.string().min(1).describe('The pattern to search for (glob pattern)')
});

export const GetFileInfoArgsSchema = z.object({
  path: z.string().min(1).describe('The path to get info for')
});

export const EditBlockArgsSchema = z.object({
  blockContent: z.string().min(1).describe(
    'The edit block content in the format: filepath, then <<<<<<< SEARCH, content to find, =======, ' +
    'new content, >>>>>>> REPLACE. Multiple blocks can be used for separate changes.'
  )
});
