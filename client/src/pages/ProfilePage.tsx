import { useState } from 'react';
import { User, Mail, Lock, MapPin, Plus, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { addressesApi, authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import AddressForm from '../components/checkout/AddressForm';
import type { Address } from '../types';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await addressesApi.getAll();
      setAddresses(response.data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({ name, email });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAddAddress = async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await addressesApi.create(data);
      setAddresses([...addresses, response.data]);
      setShowAddressForm(false);
      toast.success('Address added');
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handleUpdateAddress = async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!editingAddress) return;

    try {
      const response = await addressesApi.update(editingAddress.id, data);
      setAddresses(addresses.map((a) => (a.id === editingAddress.id ? response.data : a)));
      setEditingAddress(null);
      toast.success('Address updated');
    } catch (error) {
      toast.error('Failed to update address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await addressesApi.delete(id);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesApi.setDefault(id);
      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'password', label: 'Password', icon: Lock },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-48">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" isLoading={isSavingProfile}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                <Button
                  size="sm"
                  onClick={() => setShowAddressForm(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Address
                </Button>
              </div>

              {addresses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved addresses yet.</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{address.name}</p>
                          {address.isDefault && (
                            <span className="inline-flex items-center text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-gray-500">{address.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address.id)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => setEditingAddress(address)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button type="submit" isLoading={isSavingPassword}>
                  Change Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        title="Add New Address"
      >
        <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        title="Edit Address"
      >
        {editingAddress && (
          <AddressForm
            address={editingAddress}
            onSubmit={handleUpdateAddress}
            onCancel={() => setEditingAddress(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>
    </div>
  );
}
