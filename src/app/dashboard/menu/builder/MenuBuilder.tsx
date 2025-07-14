'use client';

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
import { 
  GripVertical, 
  Plus, 
  Eye, 
  EyeOff, 
  Star, 
  Flame, 
  Sparkles, 
  Tag,
  Trash2,
  Edit3
} from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  badge?: string;
  visible: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
  visible: boolean;
  order: number;
}

export interface Menu {
  id: string | null;
  name: string;
  published: boolean;
  categories: MenuCategory[];
}

interface MenuBuilderProps {
  menu: Menu | null;
  onMenuChange: (menu: Menu) => void;
}

const BADGE_OPTIONS = [
  { value: 'new', label: 'New', icon: Sparkles, color: 'bg-green-100 text-green-800' },
  { value: 'spicy', label: 'Spicy', icon: Flame, color: 'bg-red-100 text-red-800' },
  { value: 'popular', label: 'Popular', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'chef-special', label: "Chef&apos;s Special", icon: Tag, color: 'bg-purple-100 text-purple-800' },
];

function SortableItem({ 
  item, 
  categoryId,
  onToggleVisibility, 
  onUpdateBadge 
}: {
  item: MenuItem;
  categoryId: string;
  onToggleVisibility: (categoryId: string, itemId: string) => void;
  onUpdateBadge: (categoryId: string, itemId: string, badge: string | undefined) => void;
}) {
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
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 rounded-lg border ${
        item.visible ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'
      } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center space-x-3 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            {item.badge && (() => {
              const badge = BADGE_OPTIONS.find(b => b.value === item.badge);
              if (!badge) return null;
              const Icon = badge.icon;
              return (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {badge.label}
                </span>
              );
            })()}
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          <p className="text-lg font-bold text-blue-600">${item.price.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Badge Selector */}
        <select
          value={item.badge || ''}
          onChange={(e) => onUpdateBadge(categoryId, item.id, e.target.value || undefined)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No badge</option>
          {BADGE_OPTIONS.map(badge => (
            <option key={badge.value} value={badge.value}>
              {badge.label}
            </option>
          ))}
        </select>

        {/* Visibility Toggle */}
        <button
          onClick={() => onToggleVisibility(categoryId, item.id)}
          className={`p-2 rounded-lg transition ${
            item.visible 
              ? 'text-green-600 hover:bg-green-50' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SortableCategory({ 
  category, 
  onToggleVisibility, 
  onToggleItemVisibility, 
  onUpdateItemBadge,
  onEditCategory,
  onDeleteCategory 
}: {
  category: MenuCategory;
  onToggleVisibility: (categoryId: string) => void;
  onToggleItemVisibility: (categoryId: string, itemId: string) => void;
  onUpdateItemBadge: (categoryId: string, itemId: string, badge: string | undefined) => void;
  onEditCategory: (category: MenuCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 mb-6 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
          <span className="text-sm text-gray-500">
            ({category.items.filter(item => item.visible).length} of {category.items.length} items)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEditCategory(category)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleVisibility(category.id)}
            className={`p-2 rounded-lg transition ${
              category.visible 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {category.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Items */}
      {category.visible && (
        <SortableContext items={category.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {category.items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                categoryId={category.id}
                onToggleVisibility={onToggleItemVisibility}
                onUpdateBadge={onUpdateItemBadge}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

export default function MenuBuilder({ menu, onMenuChange }: MenuBuilderProps) {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !menu) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging a category
    const activeCategoryIndex = menu.categories.findIndex(cat => cat.id === activeId);
    const overCategoryIndex = menu.categories.findIndex(cat => cat.id === overId);

    if (activeCategoryIndex !== -1 && overCategoryIndex !== -1) {
      // Reordering categories
      const newCategories = arrayMove(menu.categories, activeCategoryIndex, overCategoryIndex);
      onMenuChange({
        ...menu,
        categories: newCategories.map((cat, index) => ({ ...cat, order: index }))
      });
      return;
    }

    // Check if we're dragging an item within a category
    const activeItemId = activeId;
    const overItemId = overId;

    // Find which categories contain these items
    let activeCategory: MenuCategory | null = null;
    let overCategory: MenuCategory | null = null;
    let activeItemIndex = -1;
    let overItemIndex = -1;

    for (const category of menu.categories) {
      const activeIdx = category.items.findIndex(item => item.id === activeItemId);
      const overIdx = category.items.findIndex(item => item.id === overItemId);
      
      if (activeIdx !== -1) {
        activeCategory = category;
        activeItemIndex = activeIdx;
      }
      if (overIdx !== -1) {
        overCategory = category;
        overItemIndex = overIdx;
      }
    }

    if (activeCategory && overCategory && activeCategory.id === overCategory.id) {
      // Reordering items within the same category
      const newItems = arrayMove(activeCategory.items, activeItemIndex, overItemIndex) as MenuItem[];
      const updatedCategories = menu.categories.map(cat =>
        cat.id === activeCategory.id ? { ...cat, items: newItems } : cat
      );
      
      onMenuChange({
        ...menu,
        categories: updatedCategories
      });
    }
  };

  const handleToggleCategoryVisibility = (categoryId: string) => {
    if (!menu) return;
    
    const updatedCategories = menu.categories.map(cat =>
      cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat
    );
    
    onMenuChange({ ...menu, categories: updatedCategories });
  };

  const handleToggleItemVisibility = (categoryId: string, itemId: string) => {
    if (!menu) return;
    
    const updatedCategories = menu.categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map(item =>
              item.id === itemId ? { ...item, visible: !item.visible } : item
            )
          }
        : cat
    );
    
    onMenuChange({ ...menu, categories: updatedCategories });
  };

  const handleUpdateItemBadge = (categoryId: string, itemId: string, badge: string | undefined) => {
    if (!menu) return;
    
    const updatedCategories = menu.categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map(item =>
              item.id === itemId ? { ...item, badge } : item
            )
          }
        : cat
    );
    
    onMenuChange({ ...menu, categories: updatedCategories });
  };



  const handleEditCategory = (category: MenuCategory) => {
    // TODO: Implement category editing modal
    console.log('Edit category:', category);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!menu) return;
    
    const updatedCategories = menu.categories.filter(cat => cat.id !== categoryId);
    onMenuChange({ ...menu, categories: updatedCategories });
  };

  if (!menu) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Found</h3>
        <p className="text-gray-600">Create your first menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Menu Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{menu.name}</h2>
            <p className="text-gray-600">
              {menu.categories.length} categories • {menu.categories.reduce((acc, cat) => acc + cat.items.length, 0)} items
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {menu.published && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
          </div>
        </div>
      </div>



      {/* Categories */}
      {menu.categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Available</h3>
          <p className="text-gray-600 mb-4">Categories need to be created in the Menu section first.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={[
              ...menu.categories.map(cat => cat.id),
              ...menu.categories.flatMap(cat => cat.items.map(item => item.id))
            ]}
            strategy={verticalListSortingStrategy}
          >
            {menu.categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onToggleVisibility={handleToggleCategoryVisibility}
                onToggleItemVisibility={handleToggleItemVisibility}
                onUpdateItemBadge={handleUpdateItemBadge}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
} 