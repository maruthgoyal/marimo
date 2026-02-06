/* Copyright 2026 Marimo. All rights reserved. */

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FileIcon, FolderIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { hotkeysAtom } from "@/core/config/config";
import { parseShortcut } from "@/core/hotkeys/shortcuts";
import { useRequestClient } from "@/core/network/requests";
import type { FileInfo } from "@/core/network/types";
import { useEventListener } from "@/hooks/useEventListener";
import { useChromeActions } from "../chrome/state";
import { fileToOpenAtom } from "../file-tree/state";
import { fileSearchAtom } from "./state";

const FileSearchDialog = () => {
  const [open, setOpen] = useAtom(fileSearchAtom);
  const hotkeys = useAtomValue(hotkeysAtom);
  const { sendSearchFiles } = useRequestClient();
  const [results, setResults] = useState<FileInfo[]>([]);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const setFileToOpen = useSetAtom(fileToOpenAtom);
  const { openApplication } = useChromeActions();

  useEventListener(document, "keydown", (e) => {
    if (parseShortcut(hotkeys.getHotkey("global.fileSearch").key)(e)) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  });

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (!value.trim()) {
        setResults([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        const response = await sendSearchFiles({
          query: value,
          includeFiles: true,
          includeDirectories: true,
          depth: 5,
          limit: 50,
        });
        setResults(response.files);
      }, 300);
    },
    [sendSearchFiles],
  );

  const handleOpenChange = useCallback(
    (value: boolean) => {
      setOpen(value);
      if (!value) {
        setQuery("");
        setResults([]);
      }
    },
    [setOpen],
  );

  // The search API does not populate isMarimoFile (it's always false for
  // performance), so all results open in the sidebar file viewer.
  const handleSelect = useCallback(
    (file: FileInfo) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      setFileToOpen(file);
      openApplication("files");
    },
    [setOpen, setFileToOpen, openApplication],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 shadow-2xl"
        usePortal={true}
      >
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            placeholder="Search files..."
            value={query}
            onValueChange={handleSearch}
          />
          <CommandList>
            {query.trim() === "" ? (
              <CommandEmpty>Type to search for files...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>No files found.</CommandEmpty>
            ) : (
              results.map((file) => (
                <CommandItem
                  key={file.id}
                  value={file.id}
                  onSelect={() => handleSelect(file)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {file.isDirectory ? (
                      <FolderIcon className="h-4 w-4 shrink-0" />
                    ) : (
                      <FileIcon className="h-4 w-4 shrink-0" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {file.path}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default FileSearchDialog;
