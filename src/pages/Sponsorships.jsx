import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const Sponsorships = () => {
  const { user, isAdmin } = useAuth();
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [sentEmailFile, setSentEmailFile] = useState(null);
  const [responseEmailFile, setResponseEmailFile] = useState(null);
  const [showDecisionMenu, setShowDecisionMenu] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    requestDescription: '',
    notes: ''
  });

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    try {
      const response = await axiosInstance.get('/sponsorships');
      setSponsorships(response.data.data || []);
    } catch (error) {
      console.error('Sponsorluklar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('companyEmail', formData.companyEmail);
      formDataToSend.append('requestDescription', formData.requestDescription);
      formDataToSend.append('notes', formData.notes);

      if (pdfFile) {
        formDataToSend.append('pdfReport', pdfFile);
      }

      if (sentEmailFile) {
        formDataToSend.append('sentEmailScreenshot', sentEmailFile);
      }

      if (responseEmailFile) {
        formDataToSend.append('responseEmailScreenshot', responseEmailFile);
      }

      if (editingSponsorship) {
        await axiosInstance.put(`/sponsorships/${editingSponsorship._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Sponsorluk güncellendi!');
      } else {
        await axiosInstance.post('/sponsorships', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Sponsorluk talebi oluşturuldu!');
      }

      fetchSponsorships();
      handleCloseModal();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDecisionChange = async (sponsorshipId, decision) => {
    try {
      await axiosInstance.put(`/sponsorships/${sponsorshipId}/decision`, { decision });
      fetchSponsorships();
      setShowDecisionMenu(null);
      alert(decision === 'approved' ? 'Sponsorluk onaylandı!' : 'Sponsorluk reddedildi!');
    } catch (error) {
      console.error('Karar güncelleme hatası:', error);
      alert('Karar güncellenemedi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu sponsorluğu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/sponsorships/${id}`);
      alert('Sponsorluk silindi!');
      fetchSponsorships();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(error.response?.data?.message || 'Sponsorluk silinemedi');
    }
  };

  const handleEdit = (sponsorship) => {
    setEditingSponsorship(sponsorship);
    setFormData({
      companyName: sponsorship.companyName,
      companyEmail: sponsorship.companyEmail,
      requestDescription: sponsorship.requestDescription,
      notes: sponsorship.notes || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSponsorship(null);
    setPdfFile(null);
    setSentEmailFile(null);
    setResponseEmailFile(null);
    setFormData({
      companyName: '',
      companyEmail: '',
      requestDescription: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      responded: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '⏳ Beklemede',
      contacted: '📞 İletişim Kuruldu',
      responded: '💬 Dönüş Sağlandı',
      approved: '✅ Onaylandı',
      rejected: '❌ Reddedildi'
    };
    return texts[status] || status;
  };

  const canEdit = (sponsorship) => {
    return true; // Tüm kullanıcılar düzenleyebilir
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsorluk Talepleri</h1>
          <p className="text-gray-600 mt-1">Sponsorluk taleplerinizi yönetin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Yeni Sponsorluk Talebi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 mb-1 font-medium">Beklemede</p>
              <p className="text-3xl font-bold text-yellow-900">
                {sponsorships.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1 font-medium">İletişim Kuruldu</p>
              <p className="text-3xl font-bold text-blue-900">
                {sponsorships.filter(s => s.status === 'contacted').length}
              </p>
            </div>
            <div className="text-4xl">📞</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 mb-1 font-medium">Dönüş Sağlandı</p>
              <p className="text-3xl font-bold text-purple-900">
                {sponsorships.filter(s => s.status === 'responded').length}
              </p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1 font-medium">Onaylandı</p>
              <p className="text-3xl font-bold text-green-900">
                {sponsorships.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1 font-medium">Reddedildi</p>
              <p className="text-3xl font-bold text-red-900">
                {sponsorships.filter(s => s.status === 'rejected').length}
              </p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>
      </div>

      {/* Sponsorships List */}
      <div className="space-y-4">
        {sponsorships.map((sponsorship) => (
          <div
            key={sponsorship._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sponsorship.companyName}
                    </h3>
                    
                    {/* Otomatik Durum Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(sponsorship.status)}`}>
                      {getStatusText(sponsorship.status)}
                    </span>

                    {/* Manuel Karar Dropdown - Sadece "Dönüş Sağlandı" durumundayken */}
                    {sponsorship.status === 'responded' && !sponsorship.finalDecision && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDecisionMenu(showDecisionMenu === sponsorship._id ? null : sponsorship._id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-200 transition"
                        >
                          📋 Karar Ver
                        </button>

                        {showDecisionMenu === sponsorship._id && (
                          <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => handleDecisionChange(sponsorship._id, 'approved')}
                              className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              ✅ Onayla
                            </button>
                            <button
                              onClick={() => handleDecisionChange(sponsorship._id, 'rejected')}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              ❌ Reddet
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    📧 {sponsorship.companyEmail}
                  </p>
                  <p className="text-sm text-gray-500">
                    👤 Oluşturan: {sponsorship?.createdBy?.firstName} {sponsorship?.createdBy?.lastName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(sponsorship)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(sponsorship._id)}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg transition"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">📋 Talep Açıklaması:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {sponsorship.requestDescription}
                </p>
              </div>

              {(sponsorship.pdfReport || sponsorship.sentEmailScreenshot || sponsorship.responseEmailScreenshot) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {sponsorship.pdfReport && (
                    <a
                      href={`${axiosInstance.defaults.baseURL}/sponsorships/${sponsorship._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition"
                    >
                      📄 PDF Raporu
                    </a>
                  )}
                  {sponsorship.sentEmailScreenshot && (
                    <a
                      href={`${axiosInstance.defaults.baseURL}/sponsorships/${sponsorship._id}/sent-email`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                    >
                      📧 Gönderilen Mail
                    </a>
                  )}
                  {sponsorship.responseEmailScreenshot && (
                    <a
                      href={`${axiosInstance.defaults.baseURL}/sponsorships/${sponsorship._id}/response-email`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition"
                    >
                      💬 Dönüş Maili
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sponsorships.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">🤝</div>
            <p className="text-gray-500 text-lg">Henüz sponsorluk talebi eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Dropdown dışına tıklanınca kapat */}
      {showDecisionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDecisionMenu(null)}
        ></div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSponsorship ? 'Sponsorluğu Düzenle' : 'Yeni Sponsorluk Talebi'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma Adı *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma E-postası *
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talep Açıklaması *
                </label>
                <textarea
                  name="requestDescription"
                  value={formData.requestDescription}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sponsorluk talebinizi detaylı açıklayın..."
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">📎 Dosyalar (Opsiyonel)</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firmaya Gönderilecek Rapor (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {editingSponsorship?.pdfReport && (
                      <p className="text-xs text-green-600 mt-1">✓ {editingSponsorship.pdfReport.filename}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gönderilen Mail Fotoğrafı
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSentEmailFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {editingSponsorship?.sentEmailScreenshot && (
                      <p className="text-xs text-green-600 mt-1">✓ {editingSponsorship.sentEmailScreenshot.filename}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firmadan Gelen Dönüş Maili Fotoğrafı
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setResponseEmailFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {editingSponsorship?.responseEmailScreenshot && (
                      <p className="text-xs text-green-600 mt-1">✓ {editingSponsorship.responseEmailScreenshot.filename}</p>
                    )}
                  </div>
                </div>

              
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ekstra notlar..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingSponsorship ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sponsorships;