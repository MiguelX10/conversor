import { useState, useRef, ChangeEvent } from 'react';
import { User, LogOut, Settings, Crown, Camera, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import DeleteAccountModal from './DeleteAccountModal';

export default function UserProfile() {
  const { user, signOut, isRegistered, updateUserProfile, deleteAccount } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (user && updateUserProfile) {
          updateUserProfile({ photoURL: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isRegistered || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      setShowDeleteModal(false);
      setShowDropdown(false);
    }
    return success;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="relative group">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs sm:text-sm">
                {getInitials(user.displayName || 'U')}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.displayName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.isPremium ? 'Premium' : 'Gratis'}
          </p>
        </div>
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {getInitials(user.displayName || 'U')}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.provider}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.totalConversions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total conversiones
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {user.dailyConversions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hoy
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Configuración
                </span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Cerrar sesión
                </span>
              </button>

              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  Eliminar cuenta
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Overlay */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email || ''}
      />
    </div>
  );
}