'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, Bars3Icon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
}

interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  }> | null;
}

interface CategoryManagementProps {
  categories: MenuCategory[];
  onCategoriesChange: () => void;
  onItemsChange: () => void;
}

export default function CategoryManagement({ 
  categories, 
  onCategoriesChange, 
  onItemsChange
}: CategoryManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    categoryId: ''
  });
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [itemViewMode, setItemViewMode] = useState<'grid' | 'list'>('grid');

  const handleCreate = async () => {
    if (!categoryName.trim()) return;
    
    // Frontend validation
    if (categoryName.trim().length > 100) {
      alert('Category name must be 100 characters or less');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() })
      });

      if (response.ok) {
        setCategoryName('');
        setIsCreateModalOpen(false);
        onCategoriesChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !categoryName.trim()) return;
    
    // Frontend validation
    if (categoryName.trim().length > 100) {
      alert('Category name must be 100 characters or less');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() })
      });

      if (response.ok) {
        setCategoryName('');
        setEditingCategory(null);
        setIsEditModalOpen(false);
        onCategoriesChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category: MenuCategory) => {
    if ((category.items?.length || 0) > 0) {
      alert('Cannot delete category with existing items. Please remove or move all items first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      const response = await fetch(`/api/menu/categories/${category.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onCategoriesChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const openEditModal = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsEditModalOpen(true);
  };

  const toggleCategoryExpansion = async (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Fetch items for this category if not already loaded
      if (!allItems.some(item => item.categoryId === categoryId)) {
        await fetchItemsForCategory(categoryId);
      }
    }
    setExpandedCategories(newExpanded);
  };

  const fetchItemsForCategory = async (categoryId: string) => {
    try {
      const response = await fetch('/api/menu/items');
      if (response.ok) {
        const items = await response.json();
        const categoryItems = items.filter((item: MenuItem) => item.categoryId === categoryId);
        setAllItems(prev => [...prev.filter(item => item.categoryId !== categoryId), ...categoryItems]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
      categoryId: ''
    });
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'taptap-menu-items');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setItemFormData(prev => ({ ...prev, imageUrl: result.url }));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const openCreateItemModal = (categoryId: string) => {
    resetItemForm();
    setItemFormData(prev => ({ ...prev, categoryId }));
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId
    });
    setIsItemModalOpen(true);
  };

  const handleCreateItem = async () => {
    if (!itemFormData.name.trim() || !itemFormData.price || !itemFormData.categoryId) return;
    
    // Frontend validation
    if (itemFormData.name.trim().length > 100) {
      alert('Item name must be 100 characters or less');
      return;
    }
    
    if (parseFloat(itemFormData.price) > 999999.99) {
      alert('Price must be less than 1,000,000');
      return;
    }
    
    if (itemFormData.description && itemFormData.description.trim().length > 500) {
      alert('Description must be 500 characters or less');
      return;
    }
    
    setIsItemLoading(true);
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemFormData.name.trim(),
          description: itemFormData.description.trim() || null,
          price: parseFloat(itemFormData.price),
          imageUrl: itemFormData.imageUrl.trim() || null,
          isAvailable: itemFormData.isAvailable,
          categoryId: itemFormData.categoryId
        })
      });

      if (response.ok) {
        resetItemForm();
        setIsItemModalOpen(false);
        onItemsChange();
        onCategoriesChange(); // Refresh categories to update item counts
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    } finally {
      setIsItemLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !itemFormData.name.trim() || !itemFormData.price || !itemFormData.categoryId) return;
    
    // Frontend validation
    if (itemFormData.name.trim().length > 100) {
      alert('Item name must be 100 characters or less');
      return;
    }
    
    if (parseFloat(itemFormData.price) > 999999.99) {
      alert('Price must be less than 1,000,000');
      return;
    }
    
    if (itemFormData.description && itemFormData.description.trim().length > 500) {
      alert('Description must be 500 characters or less');
      return;
    }
    
    setIsItemLoading(true);
    try {
      const response = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemFormData.name.trim(),
          description: itemFormData.description.trim() || null,
          price: parseFloat(itemFormData.price),
          imageUrl: itemFormData.imageUrl.trim() || null,
          isAvailable: itemFormData.isAvailable,
          categoryId: itemFormData.categoryId
        })
      });

      if (response.ok) {
        resetItemForm();
        setEditingItem(null);
        setIsItemModalOpen(false);
        onItemsChange();
        onCategoriesChange(); // Refresh categories to update item counts
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    } finally {
      setIsItemLoading(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/menu/items/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onItemsChange();
        onCategoriesChange(); // Refresh categories to update item counts
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const getItemsForCategory = (categoryId: string) => {
    return allItems.filter(item => item.categoryId === categoryId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Menu Categories</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setItemViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                itemViewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setItemViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                itemViewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <PlusIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first menu category.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Category
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryItems = getItemsForCategory(category.id);
            
            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        <div className="text-sm text-gray-500">
                          {(category.items?.length || 0)} item{(category.items?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openCreateItemModal(category.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Created {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Expandable Items Section */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                      {categoryItems.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-500">
                            <PlusIcon className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No items in this category yet.</p>
                            <button
                              onClick={() => openCreateItemModal(category.id)}
                              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add First Item
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={itemViewMode === 'grid' ? 'grid gap-3 grid-cols-1 sm:grid-cols-2' : 'space-y-3'}>
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className={`bg-white rounded-md border border-gray-200 hover:shadow-sm transition-shadow ${
                                itemViewMode === 'grid' ? 'p-4' : 'p-3 flex items-center space-x-3'
                              }`}
                            >
                              {itemViewMode === 'grid' ? (
                                // Grid View
                                <>
                                  {item.imageUrl && (
                                    <div className="mb-3">
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        width={100}
                                        height={96}
                                        className="w-full h-24 object-cover rounded-md"
                                      />
                                    </div>
                                  )}
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => openEditItemModal(item)}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <PencilIcon className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item)}
                                        className="text-gray-400 hover:text-red-600"
                                      >
                                        <TrashIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${item.price.toFixed(2)}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      item.isAvailable 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                // List View
                                <>
                                  {item.imageUrl && (
                                    <div className="flex-shrink-0">
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 object-cover rounded-md"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                                        {item.description && (
                                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.description}</p>
                                        )}
                                        <div className="flex items-center space-x-4 mt-2">
                                          <span className="text-sm font-semibold text-gray-900">
                                            ${item.price.toFixed(2)}
                                          </span>
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            item.isAvailable 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex space-x-1 ml-2">
                                        <button
                                          onClick={() => openEditItemModal(item)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item)}
                                          className="text-gray-400 hover:text-red-600"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Create New Category
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  id="category-name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Appetizers, Main Course"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isLoading || !categoryName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Edit Category
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-category-name" className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  id="edit-category-name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Appetizers, Main Course"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isLoading || !categoryName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Item Modal */}
      <Dialog
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="item-name"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              <div>
                <label htmlFor="item-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="item-description"
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Brief description of the item"
                />
              </div>
              <div>
                <label htmlFor="item-price" className="block text-sm font-medium text-gray-700">
                  Price *
                </label>
                <input
                  type="number"
                  id="item-price"
                  value={itemFormData.price}
                  onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="item-category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="item-category"
                  value={itemFormData.categoryId}
                  onChange={(e) => setItemFormData({ ...itemFormData, categoryId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="item-image" className="block text-sm font-medium text-gray-700">
                  Item Image
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    id="item-image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {isUploading && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                </div>
                {itemFormData.imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={itemFormData.imageUrl}
                      alt="Preview"
                      width={80}
                      height={80}
                      className="h-20 w-20 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input
                  id="item-available"
                  type="checkbox"
                  checked={itemFormData.isAvailable}
                  onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="item-available" className="ml-2 block text-sm text-gray-900">
                  Available for ordering
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? handleUpdateItem : handleCreateItem}
                  disabled={isItemLoading || !itemFormData.name.trim() || !itemFormData.price || !itemFormData.categoryId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isItemLoading ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 