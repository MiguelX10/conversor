import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  userEmail: string;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const success = await onConfirm();
      if (success) {
        onClose();
      } else {
        setError('Error al eliminar la cuenta. Inténtalo de nuevo.');
      }
    } catch (error) {
      setError('Error al eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Eliminar cuenta
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                    ⚠️ Esta acción es irreversible
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Se eliminarán permanentemente:
                  </p>
                  <ul className="text-red-700 dark:text-red-300 text-sm mt-2 list-disc list-inside space-y-1">
                    <li>Tu cuenta y perfil</li>
                    <li>Historial de conversiones</li>
                    <li>Configuración personalizada</li>
                    <li>Todos los datos asociados</li>
                  </ul>
                </div>

                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    Cuenta a eliminar: <span className="font-medium">{userEmail}</span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                    Para confirmar, escribe <span className="font-bold text-red-600">ELIMINAR</span> en el campo:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    disabled={isDeleting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmText !== 'ELIMINAR'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar cuenta
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}