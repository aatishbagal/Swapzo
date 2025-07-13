"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserCircle, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { searchUsersAction, type UserSearchResult } from '@/app/(dashboard)/actions';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from "@/lib/utils";

interface UserSearchProps {
  currentUserId?: string;
  className?: string;
}

export function UserSearch({ currentUserId, className }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsersAction(debouncedSearchQuery, currentUserId);
        setSearchResults(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, currentUserId]);

  // Handle clicks outside search to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && searchQuery.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 h-10 w-full md:w-64 rounded-full bg-secondary"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                </p>
                <Search className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => handleUserClick(user.username)}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-left group"
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5">
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground truncate max-w-48">
                          {user.displayName}
                        </p>
                        <Badge variant="secondary" className="text-xs font-mono shrink-0">
                          @{user.username}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-muted-foreground">
                            Trust {user.trustScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-muted-foreground">
                            {user.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <UserCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : searchQuery.trim().length >= 2 && !isSearching ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <UserCircle className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium mb-1">No users found</p>
              <p className="text-xs">Try searching with a different username or name</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}