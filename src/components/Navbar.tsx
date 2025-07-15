import React from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";

const Navbar = () => (
  <nav className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 shadow-lg sticky top-0 z-50 rounded-b-xl">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      <div className="flex items-center gap-3">
        {/* Logo Placeholder */}
        <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-blue-300 dark:from-blue-400 dark:to-blue-700 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-blue-700 dark:text-blue-300 drop-shadow-sm">TimeTableGen</span>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/" className="px-4 py-2 rounded-md font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/timetable-management" className="px-4 py-2 rounded-md font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">Timetables</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#features" className="px-4 py-2 rounded-md font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">Features</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#contact" className="px-4 py-2 rounded-md font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">Contact</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  </nav>
);

export default Navbar; 