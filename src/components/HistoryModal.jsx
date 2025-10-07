import { useState } from 'react';
import { FiX, FiClock, FiTrash2, FiEdit } from 'react-icons/fi';
import { deleteActivityPoint, updateActivityPoint } from '../api/activityPointApi';

export default function HistoryModal({ data, onClose, onSuccess }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteActivityPoint(id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Silme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      date: new Date(item.date).toISOString().split('T')[0],
      description: item.description,
      points: item.points
    });
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      await updateActivityPoint(id, editForm);
      alert('Kayıt başarıyla güncellendi');
      setEditingId(null);
      onSuccess();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FiClock className="text-blue-600" />
              Puan Geçmişi
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {data.user.firstName} {data.user.lastName} - Toplam: +{data.totalPoints} puan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {data.data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Henüz puan kaydı bulunmuyor
            </div>
          ) : (
            <div className="space-y-4">
              {data.data.map((item) => (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingId === item._id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows="2"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        min="1"
                        value={editForm.points}
                        onChange={(e) => setEditForm({ ...editForm, points: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(item._id)}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {new Date(item.date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              +{item.points}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            Ekleyen: {item.addedBy?.firstName} {item.addedBy?.lastName} •{' '}
                            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sil"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}