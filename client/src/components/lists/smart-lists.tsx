import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
// Removed Card imports for borderless Superlist-style interface
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Mic, 
  Trash2, 
  Share2, 
  Copy, 
  Users,
  ListOrdered,
  Apple,
  Milk,
  Wheat,
  Ham,
  Fish,
  Egg,
  Cookie,
  Snowflake,
  Coffee,
  Baby,
  Heart,
  Flower,
  ShoppingBag,
  Utensils,
  Wine,
  Zap,
  Package,
  Shirt,
  Settings,
  Clock,
  GripVertical,
  BookOpen,
  Film,
  MapPin,
  Gift,
  Link,
  MessageCircle,
  MessageSquare,
  Mail,
  X,
  Circle,
  DollarSign,
  Calculator,
  Edit3,
  Hash,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { CordovaDirect } from "@/lib/cordova-direct";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, SmartList, ListItem } from "@shared/schema";
import { formatCurrency, parseCurrency, formatCurrencyInput, calculateTotal, isValidCurrency } from "@/utils/currency";
import { isNativeApp } from "@/utils/capacitor";
// Mobile data hooks deprecated - now uses unified API calls

interface SmartListsProps {
  user: User;
}

const listTypeTemplates = {
  shopping: {
    name: "Shopping List",
    categories: [
      "Produce", "Meat", "Poultry", "Seafood", "Deli", "Bakery", "Prepared Foods",
      "Milk & Cream", "Yogurt", "Cheese", "Butter & Margarine", "Eggs", "Refrigerated Juices", "Packaged Deli Meats",
      "Frozen Vegetables", "Frozen Fruit", "Ice Cream & Desserts", "Frozen Meals & Pizzas", "Frozen Meat & Seafood", "Breakfast Items",
      "Canned Goods", "Pasta & Rice", "Baking Supplies", "Spices & Seasonings", "Cereals", "Snacks", "Candy & Chocolate", "Condiments", "Sauces",
      "Water", "Soft Drinks", "Juice", "Coffee & Tea", "Energy Drinks", "Beer & Wine",
      "Cleaning Supplies", "Paper Goods", "Laundry Products", "Kitchen & Trash Bags", "Pet Food & Supplies",
      "Pharmacy", "Over-the-Counter Meds", "Personal Care", "Cosmetics", "Baby Supplies", "Feminine Products",
      "Seasonal Items", "Floral", "Household Goods", "Magazines & Books", "Checkout Items"
    ],
    icon: Apple,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  punch_list: {
    name: "Contractor Punch List",
    categories: ["Plumber", "Electrician", "Painter", "Flooring", "HVAC", "General"],
    icon: Settings,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  waiting_list: {
    name: "Waiting List",
    categories: ["VIP", "Regular", "Walk-in", "Reservation"],
    icon: Clock,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  todo: {
    name: "To-Do List",
    categories: ["Work", "Personal", "Urgent", "Later"],
    icon: CheckCircle2,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  books: {
    name: "Reading List",
    categories: ["Fiction", "Non-Fiction", "Biographies", "Technical", "Self-Help", "To Read"],
    icon: BookOpen,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  },
  movies: {
    name: "Movie Watchlist",
    categories: ["Action", "Comedy", "Drama", "Sci-Fi", "Documentary", "To Watch"],
    icon: Film,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  travel: {
    name: "Travel Plans",
    categories: ["Destinations", "Hotels", "Activities", "Restaurants", "Packing", "Bookings"],
    icon: MapPin,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
  },
  gifts: {
    name: "Gift Ideas",
    categories: ["Birthday", "Holiday", "Anniversary", "Wedding", "Baby Shower", "Graduation"],
    icon: Gift,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
  },
  payments: {
    name: "Payment Schedule",
    categories: ["Bills", "Contractors", "Vendors", "Employees", "Suppliers", "Services"],
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    supportsCurrency: true
  },
  budget: {
    name: "Budget Tracker",
    categories: ["Income", "Expenses", "Savings", "Investments", "Emergency Fund", "Goals"],
    icon: Calculator,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    supportsCurrency: true
  }
};

const categoryIcons = {
  // Fresh Foods
  produce: Apple,
  meat: Ham,
  poultry: Ham,
  seafood: Fish,
  deli: Utensils,
  bakery: Cookie,
  "prepared foods": Utensils,
  
  // Dairy & Refrigerated
  dairy: Milk,
  "milk & cream": Milk,
  yogurt: Milk,
  cheese: Milk,
  "butter & margarine": Milk,
  eggs: Egg,
  "refrigerated juices": Apple,
  "packaged deli meats": Ham,
  
  // Frozen
  frozen: Snowflake,
  "frozen vegetables": Snowflake,
  "frozen fruit": Snowflake,
  "ice cream & desserts": Cookie,
  "frozen meals & pizzas": Snowflake,
  "frozen meat & seafood": Fish,
  "breakfast items": Cookie,
  
  // Pantry / Dry Goods
  pantry: ShoppingBag,
  "canned goods": Package,
  "pasta & rice": Wheat,
  "baking supplies": Cookie,
  "spices & seasonings": Package,
  cereals: Wheat,
  snacks: Cookie,
  "candy & chocolate": Cookie,
  condiments: Package,
  sauces: Package,
  
  // Beverages
  beverages: Coffee,
  water: Coffee,
  "soft drinks": Coffee,
  juice: Apple,
  "coffee & tea": Coffee,
  "energy drinks": Coffee,
  "beer & wine": Wine,
  
  // Household & Non-Food
  household: Zap,
  "cleaning supplies": Zap,
  "paper goods": ShoppingBag,
  "laundry products": Shirt,
  "kitchen & trash bags": ShoppingBag,
  "pet food & supplies": Heart,
  
  // Health & Personal Care
  pharmacy: Heart,
  "over-the-counter meds": Heart,
  "personal care": Heart,
  cosmetics: Heart,
  "baby supplies": Baby,
  "feminine products": Heart,
  
  // Seasonal & Misc
  "seasonal items": Flower,
  floral: Flower,
  "household goods": ShoppingBag,
  "magazines & books": BookOpen,
  "checkout items": ShoppingBag,
  
  // Legacy categories
  grains: Wheat,
  
  // Work categories
  plumber: Settings,
  painter: Settings,
  electrician: Settings,
  plumbing: Settings,
  electrical: Settings,
  painting: Settings
};

const getCategoryIcon = (category: string) => {
  // Don't show icon for "Other" or empty category
  if (!category || category.toLowerCase() === 'other') {
    return null;
  }
  const Icon = categoryIcons[category.toLowerCase() as keyof typeof categoryIcons];
  return Icon || null; // Return null if no matching icon found
};

const getCategoryColor = (category: string) => {
  const colors = {
    // Fresh Foods
    produce: "text-green-500",
    meat: "text-red-500",
    poultry: "text-red-400",
    seafood: "text-blue-500",
    deli: "text-orange-500",
    bakery: "text-yellow-600",
    "prepared foods": "text-orange-400",
    
    // Dairy & Refrigerated
    dairy: "text-yellow-500",
    "milk & cream": "text-yellow-500",
    yogurt: "text-yellow-400",
    cheese: "text-yellow-600",
    "butter & margarine": "text-yellow-300",
    eggs: "text-yellow-300",
    "refrigerated juices": "text-green-400",
    "packaged deli meats": "text-red-400",
    
    // Frozen
    frozen: "text-blue-400",
    "frozen vegetables": "text-green-400",
    "frozen fruit": "text-green-300",
    "ice cream & desserts": "text-pink-400",
    "frozen meals & pizzas": "text-blue-300",
    "frozen meat & seafood": "text-blue-500",
    "breakfast items": "text-yellow-500",
    
    // Pantry / Dry Goods
    pantry: "text-blue-500",
    "canned goods": "text-gray-500",
    "pasta & rice": "text-amber-500",
    "baking supplies": "text-pink-500",
    "spices & seasonings": "text-green-600",
    cereals: "text-amber-400",
    snacks: "text-orange-500",
    "candy & chocolate": "text-purple-500",
    condiments: "text-red-600",
    sauces: "text-red-500",
    
    // Beverages
    beverages: "text-brown-500",
    water: "text-blue-600",
    "soft drinks": "text-purple-400",
    juice: "text-orange-400",
    "coffee & tea": "text-brown-600",
    "energy drinks": "text-green-500",
    "beer & wine": "text-purple-600",
    
    // Household & Non-Food
    household: "text-gray-600",
    "cleaning supplies": "text-blue-300",
    "paper goods": "text-gray-400",
    "laundry products": "text-blue-400",
    "kitchen & trash bags": "text-gray-500",
    "pet food & supplies": "text-pink-500",
    
    // Health & Personal Care
    pharmacy: "text-red-600",
    "over-the-counter meds": "text-red-500",
    "personal care": "text-blue-600",
    cosmetics: "text-pink-600",
    "baby supplies": "text-pink-400",
    "feminine products": "text-pink-500",
    
    // Seasonal & Misc
    "seasonal items": "text-purple-400",
    floral: "text-pink-600",
    "household goods": "text-gray-600",
    "magazines & books": "text-indigo-500",
    "checkout items": "text-gray-500",
    
    // Legacy
    grains: "text-amber-500",
    
    // Work categories
    plumber: "text-blue-600",
    electrician: "text-yellow-600",
    painter: "text-purple-600",
    flooring: "text-brown-600",
  };
  return colors[category.toLowerCase() as keyof typeof colors] || "text-gray-500";
};

// Sortable Item Component
interface SortableItemProps {
  item: ListItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (id: string, name: string, category: string, amount: string, quantity?: string, unit?: string) => void;
  showCurrency?: boolean;
  showQuantity?: boolean;
  categories: string[];
  isEditing?: boolean;
}

function SortableItem({ item, onToggle, onDelete, onEdit, showCurrency = false, showQuantity = false, categories, isEditing = false }: SortableItemProps) {
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category || "Other");
  const [editAmount, setEditAmount] = useState(
    item.amount ? formatCurrency(item.amount, item.currency || "USD") : ""
  );
  const [editQuantity, setEditQuantity] = useState(item.quantity?.toString() || "1");
  const [editUnit, setEditUnit] = useState(item.unit || "");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 px-1 py-2 transition-all duration-150 smart-list-item-row ${
        item.completed 
          ? "opacity-60 line-through" 
          : ""
      } ${isDragging ? "scale-105 opacity-95" : ""} w-full relative will-change-transform`}
    >
      {/* LEFT: sorter + checkbox (minimal width, never grow) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          {...attributes}
          {...listeners}
          className="m-ripple p-0.5 cursor-grab active:cursor-grabbing touch-none"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            requestAnimationFrame(() => {
              e.currentTarget.style.transform = 'scale(1.1)';
              document.body.style.overflow = 'hidden';
            });
          }}
          onTouchEnd={(e) => {
            requestAnimationFrame(() => {
              e.currentTarget.style.transform = '';
              document.body.style.overflow = '';
            });
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            requestAnimationFrame(() => {
              e.currentTarget.style.transform = 'scale(1.1)';
            });
          }}
          onMouseUp={(e) => {
            requestAnimationFrame(() => {
              e.currentTarget.style.transform = '';
            });
          }}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        <Checkbox
          checked={item.completed ?? false}
          onCheckedChange={onToggle}
          className="h-4 w-4"
        />
      </div>
      {/* MIDDLE: text (takes more space) */}
      <div className="flex-1 min-w-0 max-w-none pl-1 pr-1">
        {isEditing ? (
          <div className="space-y-2 w-full">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-base min-h-[48px] py-3 px-4"
              placeholder="Item name"
              style={{
                fontSize: '16px',
                minHeight: '48px',
                lineHeight: '1.5',
                width: '100%'
              }}
            />
            <div className="flex space-x-2">
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="text-base h-12 min-h-[48px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCurrency && (
                <Input
                  value={editAmount}
                  onChange={(e) => setEditAmount(formatCurrencyInput(e.target.value))}
                  placeholder="$0.00"
                  className="text-xs h-8 w-20"
                />
              )}
            </div>
            
            {/* Quantity and Unit for Shopping Lists */}
            {showQuantity && (
              <div className="flex space-x-2">
                <Input
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  placeholder="Qty"
                  type="number"
                  min="1"
                  className="text-base h-12 w-20"
                />
                <Input
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  placeholder="Unit (lbs, oz, etc)"
                  className="text-base h-12 flex-1"
                />
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => onEdit(item.id, editName, editCategory, editAmount, editQuantity, editUnit)}
                className="h-6 text-xs"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(item.id, item.name, item.category || "Other", 
                  item.amount ? formatCurrency(item.amount, item.currency || "USD") : "",
                  item.quantity?.toString() || "1", item.unit || "")}
                className="h-6 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm('Delete this item?')) {
                    onDelete();
                  }
                }}
                className="h-6 text-xs text-red-600 hover:bg-red-50 border-red-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center w-full max-w-none min-w-0">
            {/* Category Icon - only show if icon exists */}
            {item.category && (() => {
              const Icon = getCategoryIcon(item.category);
              return Icon ? <Icon className={`h-5 w-5 flex-shrink-0 mr-3 ${getCategoryColor(item.category)}`} /> : null;
            })()}
            
            {/* Quantity badge - before text */}
            {!isEditing && (item.quantity || item.unit) && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 flex-shrink-0 px-2 py-1 mr-3">
                {item.quantity || 1}{item.unit ? ` ${item.unit}` : ''}
              </Badge>
            )}
            
            {/* Item name and details - Enhanced Mobile Layout with Wider Text Space */}
            <div className="flex items-center w-full max-w-none min-w-0">
              <div className="flex items-center min-w-0 max-w-none flex-1">
                <span 
                  className={`text-base font-medium text-gray-900 dark:text-gray-100 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${
                    item.completed ? "line-through" : ""
                  }`}
                  onClick={() => onEdit(item.id, item.name, item.category || "Other", 
                    item.amount ? formatCurrency(item.amount, item.currency || "USD") : "")}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (window.confirm('Delete this item?')) {
                      onDelete();
                    }
                  }}
                   style={{ 
                     fontSize: '16px !important',
                     lineHeight: '1.5 !important',
                     fontWeight: '600 !important',
                     color: '#111827 !important',
                     display: 'block !important',
                     visibility: 'visible' as any,
                     opacity: '1 !important',
                     minHeight: '44px !important',
                     width: '100% !important',
                     hyphens: 'none',
                     wordBreak: 'keep-all',
                     overflowWrap: 'anywhere',
                     paddingRight: '16px'
                   }}>
                  {item.name || 'Unnamed Item'}
                </span>
              </div>
              
              {/* Currency amount moved to right side */}
              {showCurrency && item.amount && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {formatCurrency(item.amount, item.currency || "USD")}
                </span>
              )}
            </div>
          </div>
        )}
        {!isEditing && item.assignedTo && (
          <p className="text-xs text-gray-500">
            Assigned to: {item.assignedTo}
          </p>
        )}
        {!isEditing && item.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {item.notes}
          </p>
        )}
      </div>
      
      {(item.priority || 1) > 1 && (
        <Badge variant="outline" className="text-xs">
          Priority {item.priority || 1}
        </Badge>
      )}
      
    </div>
  );
};

export function SmartLists({ user }: SmartListsProps) {
  const [newListName, setNewListName] = useState("");
  const [newListType, setNewListType] = useState<keyof typeof listTypeTemplates>("shopping");
  const [newListDescription, setNewListDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPriority, setNewItemPriority] = useState(1);
  const [newItemAssignedTo, setNewItemAssignedTo] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

// Enhanced fallback categorization for when AI is unavailable
const getSimpleCategory = (itemName: string): string => {
  const name = itemName.toLowerCase().trim();
  
  // Produce & Fresh
  if (/\b(apple|banana|orange|grape|berry|peach|pear|lemon|lime|avocado|mango|kiwi|melon|watermelon|strawberry|blueberry|raspberry|blackberry)\b/.test(name) ||
      /\b(lettuce|tomato|cucumber|carrot|potato|onion|garlic|pepper|celery|broccoli|cauliflower|spinach|kale|cabbage|mushroom|zucchini|squash|corn|peas|beans)\b/.test(name) ||
      /\b(herbs|cilantro|parsley|basil|mint|dill|thyme|rosemary|oregano|sage|chives)\b/.test(name)) {
    return "Produce";
  }
  // Dairy & Refrigerated
  else if (/\b(milk|cheese|yogurt|butter|cream|sour.cream|cottage.cheese|ricotta|mozzarella|cheddar|swiss|parmesan|feta|brie|gouda)\b/.test(name) ||
           /\b(eggs?|egg.whites|egg.substitute)\b/.test(name)) {
    return "Dairy";
  }
  // Meat & Seafood
  else if (/\b(chicken|beef|pork|lamb|turkey|duck|bacon|ham|sausage|pepperoni|salami|pastrami|deli.meat)\b/.test(name) ||
           /\b(fish|salmon|tuna|cod|tilapia|shrimp|crab|lobster|scallops|clams|mussels|oysters|seafood)\b/.test(name)) {
    return "Meat & Seafood";
  }
  // Pantry & Dry Goods
  else if (/\b(pasta|spaghetti|macaroni|penne|rice|quinoa|barley|oats|cereal|granola|flour|sugar|salt|pepper|spices?)\b/.test(name) ||
           /\b(beans|lentils|chickpeas|nuts|almonds|walnuts|peanuts|cashews|seeds|sunflower|pumpkin)\b/.test(name) ||
           /\b(oil|olive.oil|vinegar|balsamic|dressing|mayo|mustard|ketchup|sauce|tomato.sauce|pasta.sauce)\b/.test(name)) {
    return "Pantry";
  }
  // Beverages
  else if (/\b(juice|orange.juice|apple.juice|cranberry|grape.juice|lemonade|soda|coke|pepsi|sprite|water|sparkling|coffee|tea|beer|wine|alcohol)\b/.test(name)) {
    return "Beverages";
  }
  // Frozen
  else if (/\b(frozen|ice.cream|popsicle|sorbet|frozen.meals|frozen.pizza|frozen.vegetables|frozen.fruit)\b/.test(name)) {
    return "Frozen";
  }
  // Bakery & Bread
  else if (/\b(bread|bagel|muffin|croissant|roll|bun|tortilla|pita|crackers|cookies|cake|pie|pastry|donut)\b/.test(name)) {
    return "Bakery";
  }
  // Household & Cleaning
  else if (/\b(soap|shampoo|detergent|cleaner|paper.towels|toilet.paper|tissues|trash.bags|aluminum.foil|plastic.wrap)\b/.test(name) ||
           /\b(toothpaste|toothbrush|deodorant|shaving|razor|lotion|sunscreen|medicine|vitamins|bandaid)\b/.test(name)) {
    return "Household";
  }
  // Snacks & Candy
  else if (/\b(chips|popcorn|pretzels|crackers|candy|chocolate|gum|mints|granola.bars|protein.bars)\b/.test(name)) {
    return "Snacks";
  }
  // Canned & Jarred Goods
  else if (/\b(canned|jar|pickles|olives|peanut.butter|jelly|jam|honey|syrup|soup|broth|stock)\b/.test(name)) {
    return "Canned Goods";
  }
  return "Other";
};
  const [isVoiceAddingItem, setIsVoiceAddingItem] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; amount: string; category: string } | null>(null);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<{ listId: string; total: number } | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Unified data queries for both web and mobile
  const { isRecording, startRecording, stopRecording, isTranscribing } = useVoice({
    onTranscriptionComplete: (text) => {
      if (selectedListId && text.trim()) {
        setNewItemName(text);
        handleAddItem(selectedListId);
      }
      setIsVoiceAddingItem(false);
    },
    onError: (error) => {
      toast({
        title: "Voice Error", 
        description: error,
        variant: "destructive",
      });
      setIsVoiceAddingItem(false);
    },
  });

  // Unified smart lists query for both web and mobile
  const { data: lists = [], isLoading, error } = useQuery<(SmartList & { items: ListItem[] })[]>({
    queryKey: ["/api/smart-lists", user.id],
    queryFn: () => api.getSmartLists(user.id),
    enabled: !!user?.id
  });



  // Create list mutation (unified for web and mobile)
  const createListMutation = useMutation({
    mutationFn: () => api.createSmartList({
      userId: user.id,
      name: newListName,
      type: newListType,
      description: newListDescription,
      isShared,
      categories: listTypeTemplates[newListType].categories,
      sortBy: "category"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setNewListName("");
      setNewListDescription("");
      setIsShared(false);
      toast({
        title: "List created!",
        description: `Your ${listTypeTemplates[newListType].name.toLowerCase()} has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: ({ listId, name, category, assignedTo, amount, currency, quantity, unit }: {
      listId: string;
      name: string;
      category: string;
      assignedTo?: string;
      amount?: number | null;
      currency?: string;
      quantity?: number;
      unit?: string;
    }) => {
      console.log('Creating item with data:', { listId, name, category, assignedTo, amount, currency, quantity, unit });
      
      if (isNativeApp()) {
        // Mobile mode - use direct API call since mobileItemsQuery is not available
        return api.createListItem({
          listId,
          name,
          category,
          priority: 1,
          assignedTo: assignedTo || undefined,
          addedBy: user.name || user.id,
          amount,
          currency,
          quantity,
          unit,
        });
      }
      
      return api.createListItem({
        listId,
        name,
        category,
        priority: 1,
        assignedTo: assignedTo || undefined,
        addedBy: user.name || user.id,
        amount,
        currency,
        quantity,
        unit,
      });
    },
    onSuccess: () => {
      if (!isNativeApp()) {
        queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      }
      setNewItemName("");
      setNewItemCategory("");
      setNewItemAssignedTo("");
      setNewItemAmount("");
      setNewItemQuantity("1");
      setNewItemUnit("");
      setSelectedListId(null);
      toast({
        title: "Item added!",
        description: "Item has been added to your list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add item to list",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, name, category, amount, quantity, unit }: {
      id: string;
      name: string;
      category: string;
      amount?: string;
      quantity?: number;
      unit?: string;
    }) => {
      const updateData: any = { name, category };
      
      if (amount && amount.trim()) {
        const parsedAmount = parseCurrency(amount);
        if (parsedAmount !== null) {
          updateData.amount = parsedAmount;
          updateData.currency = "USD";
        }
      }

      // Add quantity and unit for shopping lists
      if (quantity !== undefined) {
        updateData.quantity = quantity;
      }
      if (unit !== undefined) {
        updateData.unit = unit;
      }
      
      return api.updateListItem(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setEditingItem(null);
      toast({
        title: "Item updated!",
        description: "Item has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => api.deleteSmartList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setListToDelete(null);
      if (activeTab !== "all") {
        setActiveTab("all"); // Switch to "all" view if current tab was deleted
      }
      toast({
        title: "List deleted!",
        description: "The list has been permanently removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete list",
        variant: "destructive",
      });
    },
  });

  // Update list name mutation - Fixed for proper persistence
  const updateListNameMutation = useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      console.log("📝 Attempting to update list name:", { listId, name });
      try {
        // Directly use PATCH with just the name field
        const result = await api.updateSmartList(listId, { name });
        console.log("✅ List name updated successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Failed to update list name:", error);
        throw error;
      }
    },
    onSuccess: (updatedList) => {
      // Invalidate both specific list and all lists queries
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      queryClient.invalidateQueries({ queryKey: ["smart-lists", user.id] });
      setEditingListId(null);
      setEditListName("");
      toast({
        title: "List renamed!",
        description: `List renamed to: ${updatedList.name}`,
      });
    },
    onError: (error: any) => {
      console.error("❌ List name mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to rename list. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reorder items mutation
  const reorderItemsMutation = useMutation({
    mutationFn: async ({ items }: { items: { id: string; position: number }[] }) => {
      // Update positions for multiple items at once
      const updates = items.map(item => 
        api.updateListItem(item.id, { position: item.position })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
    onError: (error) => {
      toast({
        title: "Error reordering items",
        description: error.message || "Failed to reorder items",
        variant: "destructive",
      });
    },
  });

  // Smart relabel mutation
  const relabelListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const list = lists.find(l => l.id === listId);
      if (!list) throw new Error('List not found');
      
      // Send items to AI for smart naming
      const response = await fetch('/api/relabel-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          currentName: list.name,
          items: list.items.map(item => item.name),
          listType: list.type
        })
      });
      
      if (!response.ok) throw new Error('Failed to relabel list');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      toast({
        title: "List renamed!",
        description: `List renamed to: ${result.newName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rename list",
        variant: "destructive",
      });
    },
  });

  // Calculate total function for non-currency lists
  const calculateListTotal = (list: any) => {
    let total = 0;
    list.items.forEach((item: any) => {
      const matches = item.name.match(/\$?([\d,]+\.?\d*)/g);
      if (matches) {
        matches.forEach((match: string) => {
          const amount = parseFloat(match.replace(/[$,]/g, ''));
          if (!isNaN(amount)) total += amount;
        });
      }
    });
    
    setCalculatedTotal({ listId: list.id, total });
    toast({
      title: "Total Calculated",
      description: `Total for ${list.name}: $${total.toFixed(2)}`,
    });
  };

  // Drag sensors for touch and mouse with improved touch handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - Enhanced cross-category support
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Always restore body scroll when drag ends
    document.body.style.overflow = '';

    if (!over || active.id === over.id) {
      return;
    }

    // Find the source list and item
    const sourceList = lists.find(list => 
      list.items.some(item => item.id === active.id)
    );
    
    if (!sourceList) return;

    const draggedItem = sourceList.items.find(item => item.id === active.id);
    const targetItem = sourceList.items.find(item => item.id === over.id);
    
    if (!draggedItem || !targetItem) return;

    // Allow cross-category rearrangement
    const allItems = [...sourceList.items].sort((a, b) => (a.position || 0) - (b.position || 0));
    const oldIndex = allItems.findIndex(item => item.id === active.id);
    const newIndex = allItems.findIndex(item => item.id === over.id);

    if (oldIndex !== newIndex) {
      const newOrder = arrayMove(allItems, oldIndex, newIndex);
      
      // Update positions for all items
      const updatedItems = newOrder.map((item, index) => ({
        id: item.id,
        position: index
      }));

      reorderItemsMutation.mutate({ items: updatedItems });
      
      toast({
        title: "Item moved",
        description: `"${draggedItem.name}" repositioned successfully`,
      });
    }
  };

  // Share list mutation - Enhanced native sharing for APK
  const shareListMutation = useMutation({
    mutationFn: async (listId: string) => {
      console.log("🔗 Attempting to share list:", listId);
      try {
        const result = await api.shareList(listId);
        console.log("✅ List shared successfully:", result);
        return { ...result, listId };
      } catch (error) {
        console.error("❌ Failed to share list:", error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("🎉 Share mutation success, shareCode:", data.shareCode);
      setShareCode(data.shareCode);
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      
      const shareUrl = `https://gabai.ai/shared/${data.shareCode}`;
      const listName = lists.find(l => l.id === data.listId)?.name || "list";
      const message = `Check out my "${listName}" list on GabAi!`;
      
      // Try native sharing first for mobile
      const isAPK = window.location.protocol === 'file:' || 
                    typeof (window as any).cordova !== 'undefined' || 
                    typeof (window as any).Capacitor !== 'undefined' ||
                    (window as any).IS_VOLTBUILDER_APK;
      
      if (isAPK) {
        console.log("📱 Detected APK environment, attempting native share");
        
        // Import CordovaDirect dynamically
        const { CordovaDirect } = await import('@/lib/cordova-direct');
        const shared = await CordovaDirect.shareNative({
          message: message,
          subject: `GabAi List: ${listName}`,
          url: shareUrl,
          chooserTitle: 'Share your GabAi list'
        });
        
        if (shared) {
          toast({
            title: "List shared!",
            description: "Your list has been shared successfully.",
          });
        } else {
          // Fallback to clipboard if native share fails
          console.log("📋 Native share unavailable, using clipboard");
          copyShareLink(data.shareCode);
          toast({
            title: "List shared!",
            description: "Link copied to clipboard. Paste anywhere to share.",
          });
        }
      } else {
        // Use clipboard on web
        console.log("🌐 Web environment, using clipboard");
        copyShareLink(data.shareCode);
        toast({
          title: "List shared!",
          description: "Your list is now shareable. Link copied to clipboard.",
        });
      }
    },
    onError: (error: any) => {
      console.error("❌ Share mutation error:", error);
      toast({
        title: "Error sharing list",
        description: error.message || "Failed to share list",
        variant: "destructive",
      });
    },
  });

  // Update share mode mutation
  const updateShareModeMutation = useMutation({
    mutationFn: ({ listId, shareMode }: { listId: string; shareMode: 'view' | 'edit' }) => 
      api.updateShareMode(listId, shareMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      toast({
        title: "Share mode updated!",
        description: "List permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating share mode",
        description: error.message || "Failed to update share mode",
        variant: "destructive"
      });
    }
  });

  // Join shared list mutation
  const joinListMutation = useMutation({
    mutationFn: () => api.joinSharedList(shareCode, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setShareCode("");
      toast({
        title: "Joined list!",
        description: "You've successfully joined the shared list.",
      });
    },
  });

  // Toggle item completion mutation
  const toggleItemMutation = useMutation({
    mutationFn: (itemId: string) => api.toggleListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.deleteListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      console.log("⚠️ Cannot create list: name is empty");
      toast({
        title: "List name required",
        description: "Please enter a name for your list",
        variant: "destructive",
      });
      return;
    }
    
    console.log("📝 Creating list with data:", {
      userId: user.id,
      name: newListName,
      type: newListType,
      description: newListDescription,
      isShared,
      categories: listTypeTemplates[newListType].categories,
      sortBy: "category"
    });
    
    createListMutation.mutate();
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemName.trim()) return;
    if (createItemMutation.isPending) return; // Prevent duplicate submissions
    
    const selectedList = lists.find(list => list.id === listId);
    if (!selectedList) return;

    // Use AI-powered smart categorization for shopping items
    let category = "Other";
    
    if (selectedList.type === "shopping") {
      // Call AI categorization API for intelligent grocery categorization
      try {
        const response = await fetch('/api/categorize-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            itemName: newItemName,
            listType: 'shopping'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          category = result.category || "Other";
        } else {
          // Fallback to simple categorization if AI fails
          category = getSimpleCategory(newItemName.toLowerCase());
        }
      } catch (error) {
        console.error('AI categorization failed, using fallback:', error);
        category = getSimpleCategory(newItemName.toLowerCase());
      }
    } else if (selectedList.type === "punch_list") {
      const punchCategories = {
        "Plumbing": ["plumb", "pipe", "drain", "faucet", "toilet", "shower", "sink"],
        "Electrical": ["electric", "wire", "outlet", "switch", "light", "circuit"],
        "Painting": ["paint", "brush", "roller", "primer", "wall"],
        "General": ["fix", "repair", "install", "replace"]
      };
      
      for (const [cat, items] of Object.entries(punchCategories)) {
        if (items.some(work => newItemName.toLowerCase().includes(work))) {
          category = cat;
          break;
        }
      }
    }

    setSelectedListId(listId);
    
    const template = listTypeTemplates[selectedList.type as keyof typeof listTypeTemplates];
    const amount = (template as any)?.supportsCurrency ? parseCurrency(newItemAmount) : null;
    
    createItemMutation.mutate({
      listId,
      name: newItemName,
      category,
      assignedTo: selectedList.type === "punch_list" ? newItemAssignedTo : undefined,
      amount: amount,
      currency: amount ? "USD" : undefined,
      quantity: selectedList.type === "shopping" && newItemQuantity ? parseInt(newItemQuantity) : 1,
      unit: selectedList.type === "shopping" && newItemUnit ? newItemUnit : undefined,
    });
  };

  const handleVoiceAddItem = async (listId: string) => {
    if (isVoiceAddingItem || createItemMutation.isPending) return; // Prevent duplicate voice operations
    
    setIsVoiceAddingItem(true);
    setSelectedListId(listId);
    
    try {
      if (isRecording) {
        // Stop recording if already recording
        stopRecording();
      } else {
        // Start recording
        startRecording();
      }
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Failed to record voice input",
        variant: "destructive",
      });
      setIsVoiceAddingItem(false);
    }
  };

  const copyShareLink = (code: string) => {
    // Always use production URL for sharing
    const url = `https://gabai.ai/shared/${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with collaborators",
    });
  };

  const shareViaWhatsApp = async (shareCode: string, listName: string) => {
    // Always use production URL for sharing
    const url = `https://gabai.ai/shared/${shareCode}`;
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi. You can view and collaborate here:`;
    
    // Use native share on mobile if available
    if (CordovaDirect.isAvailable()) {
      console.log("📱 Using native share menu");
      const shared = await CordovaDirect.shareNative({
        message: message,
        subject: `${listName} - GabAi List`,
        url: url,
        chooserTitle: "Share via WhatsApp"
      });
      
      if (shared) {
        toast({
          title: "Shared!",
          description: "List shared successfully",
        });
      } else {
        // Fallback to web method
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + " " + url)}`;
        window.open(whatsappUrl, '_blank');
      }
    } else {
      // Use web URL for desktop/web
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + " " + url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareViaSMS = async (shareCode: string, listName: string) => {
    // Always use production URL for sharing
    const url = `https://gabai.ai/shared/${shareCode}`;
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi:`;
    
    // Use native share on mobile if available
    if (CordovaDirect.isAvailable()) {
      console.log("📱 Using native share menu for SMS");
      const shared = await CordovaDirect.shareNative({
        message: message,
        subject: `${listName} - GabAi List`,
        url: url,
        chooserTitle: "Share via SMS"
      });
      
      if (shared) {
        toast({
          title: "Shared!",
          description: "List shared successfully",
        });
      } else {
        // Fallback to web method
        const smsUrl = `sms:?body=${encodeURIComponent(message + " " + url)}`;
        window.location.href = smsUrl;
      }
    } else {
      // Use location.href for better compatibility on mobile
      const smsUrl = `sms:?body=${encodeURIComponent(message + " " + url)}`;
      window.location.href = smsUrl;
    }
  };

  const shareViaEmail = async (shareCode: string, listName: string) => {
    // Always use production URL for sharing
    const url = `https://gabai.ai/shared/${shareCode}`;
    const subject = `${listName} - Shared List`;
    const body = `Hi there!\n\nI'm sharing my "${listName}" list with you through GabAi.\n\nYou can view and collaborate on this list by clicking the link below:\n${url}\n\nBest regards!`;
    
    // Use native share on mobile if available
    if (CordovaDirect.isAvailable()) {
      console.log("📱 Using native share menu for Email");
      const shared = await CordovaDirect.shareNative({
        message: body,
        subject: subject,
        url: "",  // URL already included in body
        chooserTitle: "Share via Email"
      });
      
      if (shared) {
        toast({
          title: "Shared!",
          description: "List shared successfully",
        });
      } else {
        // Fallback to web method
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = emailUrl;
      }
    } else {
      // Use location.href for better compatibility
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = emailUrl;
    }
  };

  const sortItemsByCategory = (items: ListItem[], categories: string[]) => {
    const categorized = categories.map(category => ({
      category,
      items: items.filter(item => item.category === category)
    })).filter(group => group.items.length > 0);
    
    const uncategorized = items.filter(item => !item.category || !categories.includes(item.category));
    if (uncategorized.length > 0) {
      categorized.push({ category: "Other", items: uncategorized });
    }
    
    return categorized;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full bg-transparent border-none shadow-none">
            <div className="px-4 pb-3">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="px-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col smart-list-container">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Lists</h1>
          <div className="flex items-center space-x-2">
            {/* Join Shared List */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Join List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Shared List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="share-code">Share Code or Link</Label>
                    <Input
                      id="share-code"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value)}
                      placeholder="Enter share code or paste link"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={() => joinListMutation.mutate()}
                    disabled={!shareCode.trim() || joinListMutation.isPending}
                    className="w-full"
                  >
                    Join List
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create New List */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Smart List</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pb-4">
                  <div>
                    <Label htmlFor="list-type">List Type</Label>
                    <Select value={newListType} onValueChange={(value: keyof typeof listTypeTemplates) => setNewListType(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(listTypeTemplates).map(([key, template]) => {
                          const Icon = template.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{template.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="list-name">List Name</Label>
                    <Input
                      id="list-name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder={`e.g., ${listTypeTemplates[newListType].name}`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="list-description">Description (optional)</Label>
                    <Textarea
                      id="list-description"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Describe what this list is for..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-shared"
                      checked={isShared}
                      onCheckedChange={setIsShared}
                    />
                    <Label htmlFor="is-shared">Enable sharing and collaboration</Label>
                  </div>

                  <Button 
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || createListMutation.isPending}
                    className="w-full"
                  >
                    Create {listTypeTemplates[newListType].name}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Scrollable List Navigation Tabs */}
      {lists.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2">
            <div className="relative">
              {/* Left Scroll Indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 flex items-center">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </div>
              
              {/* Right Scroll Indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-end">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-8" 
                   style={{ 
                     scrollbarWidth: 'none', 
                     msOverflowStyle: 'none',
                     WebkitOverflowScrolling: 'touch',
                     overscrollBehavior: 'contain',
                     touchAction: 'pan-x'
                   }}>
              {/* All Lists Tab */}
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === "all"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <ListOrdered className="h-4 w-4" />
                <span className="text-sm">All Lists</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {lists.length}
                </Badge>
              </button>
              
              {/* Individual List Tabs */}
              {lists.map((list) => {
                const template = listTypeTemplates[list.type as keyof typeof listTypeTemplates] || listTypeTemplates.todo;
                const Icon = template.icon;
                const isActive = activeTab === list.id;
                
                return (
                  <button
                    key={list.id}
                    onClick={() => setActiveTab(list.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium border-2 border-blue-300 dark:border-blue-600"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm max-w-[200px] truncate">{list.name}</span>
                    <Badge variant="secondary" className="text-xs ml-1">
                      {list.items.filter(item => !item.completed).length}
                    </Badge>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lists - Fixed mobile scrolling */}
      <div className="flex-1 w-full overflow-y-auto px-0 space-y-2 pb-32" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {lists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No lists yet. Create your first smart list!
            </p>
          </div>
        ) : (
          lists
            .filter(list => activeTab === "all" || activeTab === list.id)
            .map((list) => {
            const template = listTypeTemplates[list.type as keyof typeof listTypeTemplates] || listTypeTemplates.todo;
            const Icon = template.icon;
            const categorizedItems = sortItemsByCategory(list.items, list.categories || []);
            
            return (
              <div key={list.id} className="w-full border-none shadow-none bg-transparent">
                <div className="px-4 pb-3">
                  {/* List Title Row */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${template.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      {editingListId === list.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editListName}
                            onChange={(e) => setEditListName(e.target.value)}
                            className="text-lg font-semibold h-8"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateListNameMutation.mutate({ listId: list.id, name: editListName });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              console.log("💾 Save button clicked, updating list name:", list.id, editListName);
                              updateListNameMutation.mutate({ listId: list.id, name: editListName });
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingListId(null);
                              setEditListName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{list.name}</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] min-w-[44px] p-2 touch-action-manipulation"
                            onClick={() => {
                              console.log("✏️ Edit button clicked for list:", list.id, list.name);
                              setEditingListId(list.id);
                              setEditListName(list.name);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {list.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {list.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Controls and Stats Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Left side - Actions */}
                    <div className="flex items-center space-x-2">
                      {list.isShared ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="min-h-[44px] min-w-[60px] px-3 py-2 touch-action-manipulation" style={{ touchAction: 'manipulation' }}>
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => copyShareLink(list.shareCode!)}>
                              <Link className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaWhatsApp(list.shareCode!, list.name)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Share via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaSMS(list.shareCode!, list.name)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Share via SMS
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaEmail(list.shareCode!, list.name)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Share via Email
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs text-gray-500">Share Mode</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                updateShareModeMutation.mutate({ 
                                  listId: list.id, 
                                  shareMode: list.shareMode === 'edit' ? 'view' : 'edit' 
                                });
                              }}
                              className="flex items-center justify-between"
                            >
                              <span className="flex items-center">
                                {list.shareMode === 'edit' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                    Can Edit
                                  </>
                                ) : (
                                  <>
                                    <Circle className="h-4 w-4 mr-2" />
                                    View Only
                                  </>
                                )}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {list.shareMode === 'edit' ? 'Click for View Only' : 'Click for Can Edit'}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("🔗 Share button clicked for list:", list.id, list.name);
                            shareListMutation.mutate(list.id);
                          }}
                          disabled={shareListMutation.isPending}
                          className="min-h-[44px] min-w-[60px] px-3 py-2 touch-action-manipulation"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {shareListMutation.isPending ? "..." : "Share"}
                        </Button>
                      )}
                      
                      {/* Delete List Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setListToDelete(list.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 min-h-[44px] min-w-[44px] p-2 touch-action-manipulation"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Right side - Stats and Info */}
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {list.items.length} items
                      </Badge>
                      {(template as any)?.supportsCurrency && (
                        <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400">
                          Total: {formatCurrency(calculateTotal(list.items.map(item => item.amount)))}
                        </Badge>
                      )}
                      
                      {/* Calculated total display for non-currency lists */}
                      {calculatedTotal && calculatedTotal.listId === list.id && (
                        <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400">
                          Calculated Total: ${calculatedTotal.total.toFixed(2)}
                        </Badge>
                      )}
                      
                      {/* Smart Relabel Button */}
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => relabelListMutation.mutate(list.id)}
                        disabled={relabelListMutation.isPending}
                        className="text-xs min-h-[44px] min-w-[80px] px-3 py-2 touch-action-manipulation"
                        style={{ touchAction: 'manipulation' }}
                      >
                        {relabelListMutation.isPending ? "..." : "Smart Name"}
                      </Button>
                      
                      {/* Calculate Total Button for non-currency lists */}
                      {!(template as any)?.supportsCurrency && list.items.some(item => /\$[\d,]+\.?\d*|\d+\.?\d*\s*dollar|price|cost/i.test(item.name)) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => calculateListTotal(list)}
                          className="text-xs text-blue-600 dark:text-blue-400 min-h-[44px] min-w-[100px] px-3 py-2 touch-action-manipulation"
                          style={{ touchAction: 'manipulation' }}
                        >
                          Calculate Total
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 px-4">
                  {/* Add Item Section */}
                  <div className="p-4 bg-gray-50/30 dark:bg-gray-800/30 smart-list-input-container w-full">
                    {/* Main input row */}
                    <div className="flex items-center space-x-3 mb-4 w-full">
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add new item..."
                        className="flex-1 text-base font-normal border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                        style={{ 
                          fontSize: '16px !important',
                          minHeight: '56px !important',
                          height: '56px !important',
                          lineHeight: '1.5',
                          padding: '16px 20px !important',
                          width: '100% !important',
                          display: 'block',
                          visibility: 'visible',
                          opacity: '1',
                          position: 'relative',
                          zIndex: '1',
                          backgroundColor: 'white !important',
                          color: '#1f2937 !important',
                          border: '1px solid #d1d5db !important'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newItemName.trim()) {
                            e.preventDefault();
                            handleAddItem(list.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVoiceAddItem(list.id)}
                        disabled={isRecording || isTranscribing}
                        className={`smart-list-voice-button min-w-[48px] ${
                          isRecording ? 'bg-red-50 border-red-300 text-red-600' : ''
                        } ${isTranscribing ? 'bg-blue-50 border-blue-300 text-blue-600' : ''}`}
                        title={
                          isRecording ? "Recording... Click to stop" : 
                          isTranscribing ? "Processing voice..." : 
                          "Add item by voice"
                        }
                      >
                        <Mic className={`h-5 w-5 ${isRecording ? 'animate-pulse text-red-600' : ''}`} />
                        {isTranscribing && (
                          <span className="ml-1 text-xs">Processing...</span>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(list.id)}
                        disabled={!newItemName.trim()}
                        className="smart-list-button min-w-[48px] bg-blue-600 hover:bg-blue-700 text-white"
                        title="Add item"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* Category and options row */}
                    <div className="flex items-center space-x-3 w-full">
                      <Select 
                        value={newItemCategory} 
                        onValueChange={setNewItemCategory}
                      >
                        <SelectTrigger className="flex-1 min-h-[48px] h-[48px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(list.categories || []).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {list.type === "punch_list" && (
                      <Input
                        value={newItemAssignedTo}
                        onChange={(e) => setNewItemAssignedTo(e.target.value)}
                        placeholder="Assign to (e.g., John the Plumber)"
                        className="text-sm smart-list-input w-full"
                        style={{ 
                          fontSize: '16px', 
                          minHeight: '48px', 
                          height: '48px',
                          direction: 'ltr',
                          unicodeBidi: 'normal',
                          textAlign: 'left'
                        }}
                      />
                    )}
                    
                    {/* Currency Input for Payment/Budget Lists */}
                    {(template as any)?.supportsCurrency && (
                      <div className="flex items-center space-x-2 w-full">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <Input
                          value={newItemAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (isValidCurrency(value) || value === '') {
                              setNewItemAmount(value);
                            }
                          }}
                          onBlur={() => {
                            if (newItemAmount && isValidCurrency(newItemAmount)) {
                              setNewItemAmount(formatCurrencyInput(newItemAmount));
                            }
                          }}
                          placeholder="Amount (e.g., 150.00)"
                          className="text-sm smart-list-input flex-1"
                          style={{ 
                            fontSize: '16px', 
                            minHeight: '48px', 
                            height: '48px',
                            direction: 'ltr',
                            unicodeBidi: 'normal',
                            textAlign: 'left'
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Quantity and Unit Input for Shopping Lists */}
                    {list.type === "shopping" && (
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <Input
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                          placeholder="Qty (e.g., 2)"
                          className="text-sm smart-list-input flex-1 min-w-[80px]"
                          type="number"
                          min="1"
                          style={{ 
                            fontSize: '16px', 
                            minHeight: '44px', 
                            height: '44px',
                            direction: 'ltr',
                            unicodeBidi: 'normal',
                            textAlign: 'left'
                          }}
                        />
                        <Input
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          placeholder="Unit (e.g., lbs, pieces)"
                          className="text-sm smart-list-input flex-1"
                          style={{ 
                            fontSize: '16px', 
                            minHeight: '44px', 
                            height: '44px',
                            direction: 'ltr',
                            unicodeBidi: 'normal',
                            textAlign: 'left'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Items by Category with Drag and Drop */}
                  {categorizedItems.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      onDragStart={() => {
                        // Disable body scroll during drag
                        document.body.style.overflow = 'hidden';
                      }}
                      onDragCancel={() => {
                        // Restore body scroll if drag is cancelled
                        document.body.style.overflow = '';
                      }}
                    >
                      <div className="space-y-4">
                        {categorizedItems.map(({ category, items }) => {
                          // Sort items by position for consistent ordering
                          const sortedItems = [...items].sort((a, b) => (a.position || 0) - (b.position || 0));
                          
                          return (
                            <div key={category}>
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between smart-list-category-header">
                                <div className="flex items-center">
                                  {/* Category Icon in Header - only show if icon exists */}
                                  {(() => {
                                    const Icon = getCategoryIcon(category);
                                    return Icon ? <Icon className={`h-4 w-4 mr-2 ${getCategoryColor(category)}`} /> : null;
                                  })()}
                                  <span className="mr-2">{category}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {items.filter(item => !item.completed).length}
                                  </Badge>
                                </div>
                                {(template as any)?.supportsCurrency && (
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Total: {formatCurrency(calculateTotal(items.map(item => item.amount)))}
                                  </span>
                                )}
                              </h4>
                              
                              <SortableContext 
                                items={sortedItems.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {sortedItems.map((item) => (
                                    <SortableItem
                                      key={item.id}
                                      item={item}
                                      onToggle={() => toggleItemMutation.mutate(item.id)}
                                      onDelete={() => deleteItemMutation.mutate(item.id)}
                                      onEdit={(id, name, category, amount, quantity, unit) => {
                                        if (editingItem?.id === id) {
                                          // Save or cancel editing
                                          if (name !== item.name || category !== (item.category || "Other") || amount !== (item.amount ? formatCurrency(item.amount, item.currency || "USD") : "") ||
                                              quantity !== (item.quantity?.toString() || "1") || unit !== (item.unit || "")) {
                                            updateItemMutation.mutate({ id, name, category, amount, quantity: quantity ? parseInt(quantity) : 1, unit: unit || undefined });
                                          } else {
                                            setEditingItem(null);
                                          }
                                        } else {
                                          // Start editing
                                          setEditingItem({ id, name, category, amount });
                                        }
                                      }}
                                      showCurrency={(template as any)?.supportsCurrency}
                                      showQuantity={list.type === "shopping"}
                                      categories={list.categories || ["Other"]}
                                      isEditing={editingItem?.id === item.id}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </div>
                          );
                        })}
                      </div>
                    </DndContext>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No items yet. Add your first item above!
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete List Confirmation Dialog */}
      <Dialog open={!!listToDelete} onOpenChange={() => setListToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this list? This action cannot be undone and will permanently remove all items in the list.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setListToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (listToDelete) {
                    deleteListMutation.mutate(listToDelete);
                  }
                }}
                disabled={deleteListMutation.isPending}
              >
                {deleteListMutation.isPending ? "Deleting..." : "Delete List"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}// Force rebuild Wed Aug 27 10:28:38 PM UTC 2025
