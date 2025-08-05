import { vi } from "vitest";
import React from "react";

// Create a generic icon component factory
const createIcon = (name: string) => {
  const Icon = React.forwardRef<SVGSVGElement, any>(({ className, fill, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid={`${name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}-icon`} 
      className={className}
      data-fill={fill}
      {...props}
    />
  ));
  Icon.displayName = name;
  return Icon;
};

// Mock all commonly used lucide-react icons
vi.mock("lucide-react", () => ({
  // Navigation & UI
  Menu: createIcon("Menu"),
  X: createIcon("X"),
  ChevronRight: createIcon("ChevronRight"),
  ChevronDown: createIcon("ChevronDown"),
  ChevronUp: createIcon("ChevronUp"),
  ChevronLeft: createIcon("ChevronLeft"),
  ArrowLeft: createIcon("ArrowLeft"),
  ArrowRight: createIcon("ArrowRight"),
  ArrowUp: createIcon("ArrowUp"),
  ArrowDown: createIcon("ArrowDown"),
  MoreHorizontal: createIcon("MoreHorizontal"),
  MoreVertical: createIcon("MoreVertical"),
  
  // Actions
  Plus: createIcon("Plus"),
  PlusCircle: createIcon("PlusCircle"),
  Minus: createIcon("Minus"),
  Edit: createIcon("Edit"),
  Edit2: createIcon("Edit2"),
  Edit3: createIcon("Edit3"),
  Pencil: createIcon("Pencil"),
  Trash: createIcon("Trash"),
  Trash2: createIcon("Trash2"),
  Save: createIcon("Save"),
  Download: createIcon("Download"),
  Upload: createIcon("Upload"),
  Copy: createIcon("Copy"),
  Clipboard: createIcon("Clipboard"),
  
  // Status & Feedback
  Check: createIcon("Check"),
  CheckCircle: createIcon("CheckCircle"),
  CheckCircle2: createIcon("CheckCircle2"),
  XCircle: createIcon("XCircle"),
  AlertCircle: createIcon("AlertCircle"),
  AlertTriangle: createIcon("AlertTriangle"),
  Info: createIcon("Info"),
  HelpCircle: createIcon("HelpCircle"),
  Loader: createIcon("Loader"),
  Loader2: createIcon("Loader2"),
  RefreshCw: createIcon("RefreshCw"),
  
  // User & Social
  User: createIcon("User"),
  Users: createIcon("Users"),
  UserPlus: createIcon("UserPlus"),
  UserMinus: createIcon("UserMinus"),
  UserCheck: createIcon("UserCheck"),
  UserX: createIcon("UserX"),
  LogIn: createIcon("LogIn"),
  LogOut: createIcon("LogOut"),
  
  // Content & Media
  FileText: createIcon("FileText"),
  File: createIcon("File"),
  FolderOpen: createIcon("FolderOpen"),
  Folder: createIcon("Folder"),
  Image: createIcon("Image"),
  Music: createIcon("Music"),
  Music2: createIcon("Music2"),
  Music3: createIcon("Music3"),
  Music4: createIcon("Music4"),
  Video: createIcon("Video"),
  Camera: createIcon("Camera"),
  Mic: createIcon("Mic"),
  
  // Common Icons
  Settings: createIcon("Settings"),
  Search: createIcon("Search"),
  Home: createIcon("Home"),
  Book: createIcon("Book"),
  BookOpen: createIcon("BookOpen"),
  List: createIcon("List"),
  Grid: createIcon("Grid"),
  Heart: createIcon("Heart"),
  Star: createIcon("Star"),
  ThumbsUp: createIcon("ThumbsUp"),
  ThumbsDown: createIcon("ThumbsDown"),
  MessageSquare: createIcon("MessageSquare"),
  MessageCircle: createIcon("MessageCircle"),
  Clock: createIcon("Clock"),
  Calendar: createIcon("Calendar"),
  
  // Theme & Display
  Sun: createIcon("Sun"),
  Moon: createIcon("Moon"),
  Monitor: createIcon("Monitor"),
  Smartphone: createIcon("Smartphone"),
  Tablet: createIcon("Tablet"),
  Laptop: createIcon("Laptop"),
  
  // Shapes & Misc
  Circle: createIcon("Circle"),
  Square: createIcon("Square"),
  Triangle: createIcon("Triangle"),
  Flag: createIcon("Flag"),
  Share: createIcon("Share"),
  Share2: createIcon("Share2"),
  Lock: createIcon("Lock"),
  Unlock: createIcon("Unlock"),
  Eye: createIcon("Eye"),
  EyeOff: createIcon("EyeOff"),
  Filter: createIcon("Filter"),
  SortAsc: createIcon("SortAsc"),
  SortDesc: createIcon("SortDesc"),
  
  // Communication
  Mail: createIcon("Mail"),
  Send: createIcon("Send"),
  Phone: createIcon("Phone"),
  Bell: createIcon("Bell"),
  BellOff: createIcon("BellOff"),
  
  // Business & Commerce
  ShoppingCart: createIcon("ShoppingCart"),
  CreditCard: createIcon("CreditCard"),
  DollarSign: createIcon("DollarSign"),
  TrendingUp: createIcon("TrendingUp"),
  TrendingDown: createIcon("TrendingDown"),
  
  // Development
  Code: createIcon("Code"),
  Terminal: createIcon("Terminal"),
  GitBranch: createIcon("GitBranch"),
  GitCommit: createIcon("GitCommit"),
  GitPullRequest: createIcon("GitPullRequest"),
  
  // Alignment & Layout
  AlignLeft: createIcon("AlignLeft"),
  AlignCenter: createIcon("AlignCenter"),
  AlignRight: createIcon("AlignRight"),
  AlignJustify: createIcon("AlignJustify"),
  
  // Other Common Icons
  Hash: createIcon("Hash"),
  Zap: createIcon("Zap"),
  Activity: createIcon("Activity"),
  Anchor: createIcon("Anchor"),
  Award: createIcon("Award"),
  Battery: createIcon("Battery"),
  Bluetooth: createIcon("Bluetooth"),
  Wifi: createIcon("Wifi"),
  WifiOff: createIcon("WifiOff"),
  Cloud: createIcon("Cloud"),
  CloudOff: createIcon("CloudOff"),
  Database: createIcon("Database"),
  HardDrive: createIcon("HardDrive"),
  Layers: createIcon("Layers"),
  Layout: createIcon("Layout"),
  Link: createIcon("Link"),
  Link2: createIcon("Link2"),
  Map: createIcon("Map"),
  MapPin: createIcon("MapPin"),
  Maximize: createIcon("Maximize"),
  Maximize2: createIcon("Maximize2"),
  Minimize: createIcon("Minimize"),
  Minimize2: createIcon("Minimize2"),
  Package: createIcon("Package"),
  Paperclip: createIcon("Paperclip"),
  Pause: createIcon("Pause"),
  Play: createIcon("Play"),
  Power: createIcon("Power"),
  Printer: createIcon("Printer"),
  Radio: createIcon("Radio"),
  Repeat: createIcon("Repeat"),
  RotateCcw: createIcon("RotateCcw"),
  RotateCw: createIcon("RotateCw"),
  Rss: createIcon("Rss"),
  Shield: createIcon("Shield"),
  ShieldCheck: createIcon("ShieldCheck"),
  ShieldOff: createIcon("ShieldOff"),
  Shuffle: createIcon("Shuffle"),
  Sidebar: createIcon("Sidebar"),
  SkipBack: createIcon("SkipBack"),
  SkipForward: createIcon("SkipForward"),
  Sliders: createIcon("Sliders"),
  Sparkles: createIcon("Sparkles"),
  Speaker: createIcon("Speaker"),
  Tag: createIcon("Tag"),
  Target: createIcon("Target"),
  Thermometer: createIcon("Thermometer"),
  ToggleLeft: createIcon("ToggleLeft"),
  ToggleRight: createIcon("ToggleRight"),
  Tool: createIcon("Tool"),
  Tv: createIcon("Tv"),
  Type: createIcon("Type"),
  Umbrella: createIcon("Umbrella"),
  Volume: createIcon("Volume"),
  Volume1: createIcon("Volume1"),
  Volume2: createIcon("Volume2"),
  VolumeX: createIcon("VolumeX"),
  Watch: createIcon("Watch"),
  Wind: createIcon("Wind"),
  ZoomIn: createIcon("ZoomIn"),
  ZoomOut: createIcon("ZoomOut"),
}));