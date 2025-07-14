'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import Image from 'next/image';

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
  }>;
}

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

interface ItemManagementProps {
  items: MenuItem[];
  categories: MenuCategory[];
  onItemsChange: () => void;
}

export default function ItemManagement({ 
  items, 
  categories, 
  onItemsChange 
}: ItemManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    categoryId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
      categoryId: ''
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.price || !formData.categoryId) return;
    
    // Frontend validation
    if (formData.name.trim().length > 100) {
      alert('Item name must be 100 characters or less');
      return;
    }
    
    if (parseFloat(formData.price) > 999999.99) {
      alert('Price must be less than 1,000,000');
      return;
    }
    
    if (formData.description && formData.description.trim().length > 500) {
      alert('Description must be 500 characters or less');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl.trim() || null,
          isAvailable: formData.isAvailable,
          categoryId: formData.categoryId
        })
      });

      if (response.ok) {
        resetForm();
        setIsCreateModalOpen(false);
        onItemsChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !formData.name.trim() || !formData.price || !formData.categoryId) return;
    
    // Frontend validation
    if (formData.name.trim().length > 100) {
      alert('Item name must be 100 characters or less');
      return;
    }
    
    if (parseFloat(formData.price) > 999999.99) {
      alert('Price must be less than 1,000,000');
      return;
    }
    
    if (formData.description && formData.description.trim().length > 500) {
      alert('Description must be 500 characters or less');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl.trim() || null,
          isAvailable: formData.isAvailable,
          categoryId: formData.categoryId
        })
      });

      if (response.ok) {
        resetForm();
        setEditingItem(null);
        setIsEditModalOpen(false);
        onItemsChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/menu/items/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onItemsChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId
    });
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
        <button
          onClick={openCreateModal}
          disabled={categories.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {categories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No categories available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You need to create at least one category before adding menu items.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && categories.length > 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <PhotoIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first menu item.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {item.imageUrl && (
                <div className="mb-4">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
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
              <div className="text-sm text-gray-500 mt-2">
                Category: {item.categoryName}
              </div>
            </div>
          ))}
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
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Add New Menu Item
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="item-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploading(true);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {isUploading && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={formData.imageUrl}
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
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="item-available" className="ml-2 block text-sm text-gray-900">
                  Available for ordering
                </label>
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
                  disabled={isLoading || !formData.name.trim() || !formData.price || !formData.categoryId}
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
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Edit Menu Item
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-item-name" className="block text-sm font-medium text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="edit-item-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              <div>
                <label htmlFor="edit-item-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="edit-item-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Brief description of the item"
                />
              </div>
              <div>
                <label htmlFor="edit-item-price" className="block text-sm font-medium text-gray-700">
                  Price *
                </label>
                <input
                  type="number"
                  id="edit-item-price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="edit-item-category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="edit-item-category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                <label htmlFor="edit-item-image" className="block text-sm font-medium text-gray-700">
                  Item Image
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    id="edit-item-image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploading(true);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {isUploading && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={formData.imageUrl}
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
                  id="edit-item-available"
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-item-available" className="ml-2 block text-sm text-gray-900">
                  Available for ordering
                </label>
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
                  disabled={isLoading || !formData.name.trim() || !formData.price || !formData.categoryId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 