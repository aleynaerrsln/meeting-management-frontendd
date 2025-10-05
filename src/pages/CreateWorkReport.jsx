import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiUpload, FiFile, FiImage, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../utils/axios';

const CreateWorkReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workDescription: '',
    startTime: '09:00',
    endTime: '18:00',
    project: '',
    notes: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Dosya tipi kontrolü
    const validFiles = files.filter(file => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      if (!isPdf && !isImage) {
        showNotification(`${file.name} geçersiz dosya tipi. Sadece PDF ve resim yükleyebilirsiniz.`, 'error');
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showNotification(`${file.name} çok büyük. Maksimum 10MB yükleyebilirsiniz.`, 'error');
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') return <FiFile className="text-red-500" />;
    if (file.type.startsWith('image/')) return <FiImage className="text-blue-500" />;
    return <FiFile className="text-gray-500" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.workDescription || !formData.startTime || !formData.endTime) {
      showNotification('Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    setLoading(true);

    try {
      // FormData oluştur
      const submitData = new FormData();
      
      // Form verilerini ekle
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Dosyaları ekle
      selectedFiles.forEach(file => {
        submitData.append('attachments', file);
      });

      await axiosInstance.post('/work-reports', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Çalışma raporu başarıyla oluşturuldu!', 'success');
      setTimeout(() => navigate('/work-reports'), 1500);
    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      showNotification(
        error.response?.data?.message || 'Rapor oluşturulurken hata oluştu',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Yeni Çalışma Raporu</h2>
          <button
            onClick={() => navigate('/work-reports')}
            className="text-gray-600 hover:text-gray-800"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarih */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Çalışma Açıklaması */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Çalışma Açıklaması <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.workDescription}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bugün yapılan çalışmaları detaylı olarak açıklayın..."
              required
            />
          </div>

          {/* Saat Aralığı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Saati <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Saati <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Proje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proje Adı
            </label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Proje adını girin (opsiyonel)"
            />
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ek Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Varsa ek notlarınızı buraya ekleyin..."
            />
          </div>

          {/* 🆕 Dosya Ekleme Bölümü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Ekleri (PDF veya Resim)
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiUpload />
                <span>Dosya Seç</span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PDF veya resim dosyaları yükleyebilirsiniz (Maks. 10MB)
              </p>
            </div>

            {/* Seçilen Dosyalar Listesi */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Seçilen Dosyalar ({selectedFiles.length})
                </h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FiSave />
              {loading ? 'Kaydediliyor...' : 'Raporu Kaydet'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/work-reports')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkReport;