import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar';
import { User } from '../lib/types';
import { List, Map, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';
import naviSafeLogo from 'figma:asset/43a784f34af36c961963a10e84aa679ef45d4749.png';

interface AdminAppSidebarProps {
  user: User;
  onLogout: () => void;
  activeView: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

export function AdminAppSidebar({ user, onLogout, activeView, onViewChange }: AdminAppSidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={naviSafeLogo} alt="NaviSafe Logo" className="h-10 w-10 object-contain" />
          <div className="flex flex-col">
            <span className="font-semibold">NaviSafe</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange('list')}
                  isActive={activeView === 'list'}
                >
                  <List className="w-4 h-4" />
                  <span>List View</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange('map')}
                  isActive={activeView === 'map'}
                >
                  <Map className="w-4 h-4" />
                  <span>Map View</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user.username}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="shrink-0"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600 dark:bg-red-700 dark:hover:bg-red-800 dark:border-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
