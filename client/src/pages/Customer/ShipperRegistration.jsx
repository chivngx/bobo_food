import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Truck, User, Phone, Mail, CreditCard, FileText, Camera, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import ShipperTermsModal from '../../components/shared/ShipperTermsModal';
import FileUploadBox from '../../components/shared/FileUploadBox';
import { getCurrentUser } from '../../api/userApi';
import React from 'react';

// API base URL (keep consistent with userApi.js)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ShipperRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [autoFillLoading, setAutoFillLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null); // null | 'already_shipper' | 'shop_restriction' | 'allowed'
  const [popup, setPopup] = useState({ open: false, type: 'info', message: '' });
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    vehiclePlateNumber: '',
    idCardNumber: '',
    driverLicenseNumber: '',
    bankAccountNumber: '',
    bankAccountName: '',
    bankName: '',
    // extended to match shipper_contract
    relativeName: '',
    relativePhone: '',
    relativeRelationship: '',
    bankOwnerName: '',
    idDocumentExpiryDate: '',
  });

  const [files, setFiles] = useState({
    profilePhoto: null,
    idCardFront: null,
    idCardBack: null,
    vehicleRegistration: null,
    drivingLicense: null,
    proofImage: null,
    healthCertificate: null,
    criminalRecord: null,
    lltp01: null,
    lltpAppointment: null,
    drivingLicenseBack: null,
    motorcycleLicenseFront: null,
    motorcycleLicenseBack: null,
  });

  // Option for Legal Record submission: 'lltp2' or 'lltp1_combo'
  const [lltpOption, setLltpOption] = useState('lltp2');

  const [previews, setPreviews] = useState({
    profilePhoto: null,
    idCardFront: null,
    idCardBack: null,
    vehicleRegistration: null,
    drivingLicense: null,
    proofImage: null,
    healthCertificate: null,
    criminalRecord: null,
    lltp01: null,
    lltpAppointment: null,
    drivingLicenseBack: null,
    motorcycleLicenseFront: null,
    motorcycleLicenseBack: null,
  });

  // Auto-fill user information and check registration eligibility on component mount
  React.useEffect(() => {
    const autoFillUserInfo = async () => {
      try {
        setAutoFillLoading(true);
        console.log('🔄 [ShipperRegistration] Bắt đầu auto-fill và kiểm tra role...');
        
        const userData = await getCurrentUser();
        console.log('📥 [ShipperRegistration] API Response:', userData);
        
        if (userData && typeof userData === 'object' && userData.user) {
          console.log('✅ [ShipperRegistration] User data hợp lệ');
          const user = userData.user;
          
          // 🔍 Kiểm tra role và profile để xác định trạng thái đăng ký
          const hasShopProfile = user.shop_profile && typeof user.shop_profile === 'object';
          const hasShipperProfile = user.shipper_profile && typeof user.shipper_profile === 'object';
          const isShopRole = user.role === 'shop';
          const isShipperRole = user.role === 'shipper';

          console.log('🔍 [ShipperRegistration] Role Check:', {
            role: user.role,
            hasShopProfile,
            hasShipperProfile,
            isShopRole,
            isShipperRole
          });

          // Xác định trạng thái đăng ký
          if (isShipperRole || hasShipperProfile) {
            console.log('⚠️ [ShipperRegistration] User đã là shipper');
            setRegistrationStatus('already_shipper');
          } else if (isShopRole) {
            console.log('⚠️ [ShipperRegistration] Shop không thể đăng ký làm shipper');
            setRegistrationStatus('shop_restriction');
          } else {
            console.log('✅ [ShipperRegistration] User được phép đăng ký làm shipper');
            setRegistrationStatus('allowed');
          }
          
          // Auto-fill thông tin cơ bản
          setFormData(prev => ({
            ...prev,
            fullName: prev.fullName || (user.full_name ? String(user.full_name).trim() : ''),
            email: prev.email || (user.email ? String(user.email).trim() : ''),
            phone: prev.phone || (user.phone ? String(user.phone).trim() : ''),
            bankAccountName: prev.bankAccountName || (user.full_name ? String(user.full_name).trim() : ''),
          }));

          // Nếu có shipper_profile, auto-fill các trường shipper
          if (hasShipperProfile) {
            const shipperData = user.shipper_profile;
            console.log('📦 [ShipperRegistration] Auto-fill từ shipper_profile:', shipperData);
            
            setFormData(prev => ({
              ...prev,
              vehiclePlateNumber: shipperData.vehicle_number ? String(shipperData.vehicle_number).trim() : prev.vehiclePlateNumber,
              idCardNumber: shipperData.identity_card ? String(shipperData.identity_card).trim() : prev.idCardNumber,
            }));
          }
        } else {
          console.warn('⚠️ [ShipperRegistration] User data không hợp lệ:', userData);
          setRegistrationStatus('allowed'); // Default cho phép nếu không lấy được thông tin
        }
      } catch (error) {
        console.error('❌ [ShipperRegistration] Error auto-filling user info:', error);
        setRegistrationStatus('allowed'); // Default cho phép nếu có lỗi
      } finally {
        setAutoFillLoading(false);
      }
    };

    autoFillUserInfo();
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateIDCard = (idCard) => {
    const idCardRegex = /^[0-9]{9}$|^[0-9]{12}$/;
    return idCardRegex.test(idCard);
  };

  const validateVehiclePlate = (plate) => {
    const plateRegex = /^[0-9]{2}[A-Z]{1,2}[-\s]?[0-9]{4,5}$/i;
    return plate.length >= 7 && plate.length <= 12;
  };

  const validateBankAccount = (account) => {
    return account.length >= 8 && account.length <= 20 && /^[0-9]+$/.test(account);
  };

  const validateFileSize = (file, maxSizeMB = 5) => {
    return file && file.size <= maxSizeMB * 1024 * 1024;
  };

  const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']) => {
    return file && allowedTypes.includes(file.type);
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'fullName':
        if (!value || value.trim().length < 2) {
          error = 'Họ tên phải có ít nhất 2 ký tự';
        } else if (value.trim().length > 100) {
          error = 'Họ tên không được vượt quá 100 ký tự';
        }
        break;
      case 'phone':
      case 'relativePhone':
        if (!value) {
          if (name === 'phone') error = 'Số điện thoại là bắt buộc';
        } else if (!validatePhone(value)) {
          error = 'Số điện thoại không hợp lệ (VD: 0912345678)';
        }
        break;
      case 'email':
        if (!value) {
          error = 'Email là bắt buộc';
        } else if (!validateEmail(value)) {
          error = 'Email không hợp lệ';
        }
        break;
      case 'idCardNumber':
        if (value && !validateIDCard(value)) {
          error = 'CCCD phải có 9 hoặc 12 số';
        }
        break;
      case 'vehiclePlateNumber':
        if (value && !validateVehiclePlate(value)) {
          error = 'Biển số xe không hợp lệ (VD: 30A-12345)';
        }
        break;
      case 'bankAccountNumber':
        if (value && !validateBankAccount(value)) {
          error = 'Số tài khoản phải từ 8-20 chữ số';
        }
        break;
      case 'bankAccountName':
      case 'bankOwnerName':
        if (value && value.trim().length < 2) {
          error = 'Tên chủ tài khoản phải có ít nhất 2 ký tự';
        }
        break;
      case 'driverLicenseNumber':
        if (value && value.trim().length < 5) {
          error = 'Số giấy phép lái xe không hợp lệ';
        }
        break;
      case 'idDocumentExpiryDate':
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate <= today) {
            error = 'Ngày hết hạn phải sau ngày hôm nay';
          }
        }
        break;
    }
    
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user is typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const targetElement = e.target; // Save reference
    
    // Validate on blur
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Update styles after validation - check if element still exists
    setTimeout(() => {
      if (targetElement && targetElement.parentNode) {
        if (error) {
          targetElement.style.borderColor = '#ef4444';
          targetElement.style.backgroundColor = '#fef2f2';
        } else {
          targetElement.style.borderColor = '#d1d5db';
          targetElement.style.backgroundColor = '#fafafa';
        }
        targetElement.style.boxShadow = 'none';
      }
    }, 0);
  };

  const handleSafeNavigate = (path) => {
    try {
      if (!path || typeof path !== 'string' || path.trim() === '') {
        console.error('❌ [ShipperRegistration] Invalid path:', path);
        return;
      }
      console.log('✅ [ShipperRegistration] Navigating to:', path);
      navigate(path);
    } catch (error) {
      console.error('❌ [ShipperRegistration] Navigation error:', error);
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (!validateFileSize(file, 5)) {
        setErrors(prev => ({ ...prev, [fieldName]: 'File không được vượt quá 5MB' }));
        setPopup({ open: true, type: 'error', message: `⚠️ File ${fieldName} không được vượt quá 5MB` });
        return;
      }
      
      // Validate file type
      if (!validateFileType(file)) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP) hoặc PDF' }));
        setPopup({ open: true, type: 'error', message: '⚠️ Chỉ chấp nhận file ảnh (JPG, PNG, WEBP) hoặc PDF' });
        return;
      }
      
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
      setFiles(prev => ({ ...prev, [fieldName]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprehensive validation
    const newErrors = {};
    
    // Validate all required fields
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên là bắt buộc và phải có ít nhất 2 ký tự';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Validate optional but important fields
    if (formData.idCardNumber && !validateIDCard(formData.idCardNumber)) {
      newErrors.idCardNumber = 'CCCD phải có 9 hoặc 12 số';
    }
    
    if (formData.vehiclePlateNumber && !validateVehiclePlate(formData.vehiclePlateNumber)) {
      newErrors.vehiclePlateNumber = 'Biển số xe không hợp lệ';
    }
    
    if (formData.bankAccountNumber && !validateBankAccount(formData.bankAccountNumber)) {
      newErrors.bankAccountNumber = 'Số tài khoản phải từ 8-20 chữ số';
    }
    
    if (formData.relativePhone && !validatePhone(formData.relativePhone)) {
      newErrors.relativePhone = 'Số điện thoại người thân không hợp lệ';
    }
    
    // Check if there are any validation errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setPopup({ open: true, type: 'error', message: '⚠️ Vui lòng kiểm tra lại thông tin đã nhập' });
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!agreedToTerms) {
      setPopup({ open: true, type: 'error', message: '⚠️ Vui lòng đồng ý với điều khoản dịch vụ để tiếp tục' });
      return;
    }

    // Validate required contract docs based on chosen option
    const hasHealth = Boolean(files.healthCertificate);
    const hasCriminal = Boolean(files.criminalRecord);
    const hasLltpCombo = Boolean(files.lltp01) && Boolean(files.lltpAppointment);
    if (!hasHealth) {
      setPopup({ open: true, type: 'error', message: '⚠️ Yêu cầu giấy khám sức khỏe.' });
      return;
    }
    if (lltpOption === 'lltp2' && !hasCriminal) {
      setPopup({ open: true, type: 'error', message: '⚠️ Vui lòng tải lên LLTP số 02.' });
      return;
    }
    if (lltpOption === 'lltp1_combo' && !hasLltpCombo) {
      setPopup({ open: true, type: 'error', message: '⚠️ Vui lòng tải lên LLTP số 01 và Giấy hẹn LLTP số 02.' });
      return;
    }

    try {
      setLoading(true);

      // Helper: upload file and return URL
      const uploadFile = async (file) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('image', file);
        const res = await axios.post(`${API_BASE_URL}/images/upload/shipper-contract`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        return res.data?.imageUrl || null;
      };

      // Upload selected files and collect URLs
      const [portrait_photo_url, id_card_front_url, id_card_back_url, vehicle_registration_url, driving_license_front_url, driving_license_back_url, motorcycle_license_front_url, motorcycle_license_back_url, proof_image_url, health_certificate_url, criminal_record_url, lltp_01_url, lltp_appointment_url] = await Promise.all([
        uploadFile(files.profilePhoto),
        uploadFile(files.idCardFront),
        uploadFile(files.idCardBack),
        uploadFile(files.vehicleRegistration),
        uploadFile(files.drivingLicense),
        uploadFile(files.drivingLicenseBack),
        uploadFile(files.motorcycleLicenseFront),
        uploadFile(files.motorcycleLicenseBack),
        uploadFile(files.proofImage),
        uploadFile(files.healthCertificate),
        uploadFile(files.criminalRecord),
        uploadFile(files.lltp01),
        uploadFile(files.lltpAppointment),
      ]);

      // Validate required file uploads succeeded
      if (!health_certificate_url) {
        setPopup({ open: true, type: 'error', message: '❌ Upload giấy khám sức khỏe thất bại. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }
      if (lltpOption === 'lltp2' && !criminal_record_url) {
        setPopup({ open: true, type: 'error', message: '❌ Upload LLTP số 02 thất bại. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }
      if (lltpOption === 'lltp1_combo' && (!lltp_01_url || !lltp_appointment_url)) {
        setPopup({ open: true, type: 'error', message: '❌ Upload LLTP số 01 hoặc Giấy hẹn thất bại. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }

      // Get current user id for linking
      const me = await getCurrentUser();
      const user_id = me?.user?.id;

      if (!user_id) {
        setPopup({ open: true, type: 'error', message: '❌ Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
        setLoading(false);
        return;
      }

      // Build payload matching shipper_contracts model
      const payload = {
        user_id,
        full_name: String(formData.fullName || '').trim(),
        phone: String(formData.phone || '').trim(),
        email: formData.email || null,
        // relatives
        relative_name: formData.relativeName ? String(formData.relativeName).trim() : null,
        relative_phone: formData.relativePhone ? String(formData.relativePhone).trim() : null,
        relative_relationship: formData.relativeRelationship ? String(formData.relativeRelationship).trim() : null,
        // bank
        bank_owner_name: formData.bankAccountName ? String(formData.bankAccountName).trim() : null,
        bank_name: formData.bankName ? String(formData.bankName).trim() : null,
        bank_account_number: formData.bankAccountNumber ? String(formData.bankAccountNumber).trim() : null,
        bank_account_name: formData.bankAccountName ? String(formData.bankAccountName).trim() : null,
        // vehicle
        vehicle_plate_number: formData.vehiclePlateNumber ? String(formData.vehiclePlateNumber).trim() : null,
        // IDs
        id_card_number: formData.idCardNumber ? String(formData.idCardNumber).trim() : null,
        id_document_expiry_date: formData.idDocumentExpiryDate || null,
        driver_license_number: formData.driverLicenseNumber ? String(formData.driverLicenseNumber).trim() : null,
        // uploads
        portrait_photo_url: portrait_photo_url || null,
        id_card_front_url: id_card_front_url || null,
        id_card_back_url: id_card_back_url || null,
        vehicle_registration_url: vehicle_registration_url || null,
        driving_license_front_url: driving_license_front_url || null,
        driving_license_back_url: driving_license_back_url || null,
        motorcycle_license_front_url: motorcycle_license_front_url || null,
        motorcycle_license_back_url: motorcycle_license_back_url || null,
        health_certificate_url: health_certificate_url || null,
        criminal_record_url: criminal_record_url || null,
        lltp_01_url: lltp_01_url || null,
        lltp_appointment_url: lltp_appointment_url || null,
        proof_image_url: proof_image_url || null,
        
      };

      const response = await axios.post(
        `${API_BASE_URL}/shipper/register`,
        payload,
        { withCredentials: true }
      );

      setPopup({ open: true, type: 'success', message: '✅ Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.' });
      setTimeout(() => {
        handleSafeNavigate('/customer/profile');
      }, 600);
    } catch (error) {
      setPopup({
        open: true,
        type: 'error',
        message: '❌ Đăng ký thất bại: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  // Render "Already Shipper" message
  const renderAlreadyShipperMessage = () => (
    <div style={{
      maxWidth: '48rem',
      margin: '2rem auto',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 0.125rem 1rem rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          width: '5rem',
          height: '5rem',
          borderRadius: '50%',
          background: '#fed7aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Truck size={40} color="#f97316" />
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#333',
          marginBottom: '1rem'
        }}>
          Bạn đã là Shipper rồi! 🎉
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#666',
          marginBottom: '2rem'
        }}>
          Tài khoản của bạn đã được đăng ký làm Shipper. Hãy chuyển đến trang quản lý Shipper để bắt đầu làm việc.
        </p>
        <button
          onClick={() => handleSafeNavigate('/shipper/dashboard')}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #f97316 0%, #ff9447 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 0.25rem 1rem rgba(249, 115, 22, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-0.125rem)';
            e.currentTarget.style.boxShadow = '0 0.375rem 1.25rem rgba(249, 115, 22, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0.25rem 1rem rgba(249, 115, 22, 0.3)';
          }}
        >
          Đi đến Dashboard Shipper
        </button>
      </div>
    </div>
  );

  // Render "Shop Restriction" message
  const renderShopRestriction = () => (
    <div style={{
      maxWidth: '48rem',
      margin: '2rem auto',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 0.125rem 1rem rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          width: '5rem',
          height: '5rem',
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Truck size={40} color="#ef4444" />
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#333',
          marginBottom: '1rem'
        }}>
          Shop không thể đăng ký làm Shipper
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#666',
          marginBottom: '2rem'
        }}>
          Tài khoản Shop không được phép đăng ký trở thành Shipper. Vui lòng sử dụng tài khoản User để đăng ký.
        </p>
        <button
          onClick={() => handleSafeNavigate('/customer/profile')}
          style={{
            padding: '1rem 2rem',
            background: '#fff',
            color: '#ef4444',
            border: '0.125rem solid #ef4444',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 0.125rem 1rem rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          Quay lại Trang Cá Nhân
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: '#f5f5f5',
      paddingBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ff9447 100%)',
        padding: '2rem 1.5rem',
        boxShadow: '0 0.25rem 1.5rem rgba(249, 115, 22, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <button
            onClick={() => handleSafeNavigate('/customer/profile')}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '0.75rem',
              width: '3.5rem',
              height: '3.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
          </button>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              Đăng ký trở thành Shipper
            </h1>
            <div style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.95)', marginTop: '0.5rem', fontWeight: '500' }}>
              Điền thông tin để bắt đầu
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Registration Status */}
      {autoFillLoading ? (
        <div style={{
          maxWidth: '48rem',
          margin: '2rem auto',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', color: '#666' }}>⏳ Đang kiểm tra thông tin...</div>
        </div>
      ) : registrationStatus === 'already_shipper' ? (
        renderAlreadyShipperMessage()
      ) : registrationStatus === 'shop_restriction' ? (
        renderShopRestriction()
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} style={{
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '2rem 1.5rem'
        }}>
        {/* Auto-fill Notification */}
        {!autoFillLoading && (
          <div style={{
            background: '#fed7aa',
            border: '0.125rem solid #f97316',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ color: '#f97316', marginTop: '0.25rem', fontSize: '1.5rem' }}>ℹ️</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.125rem', color: '#92400e', marginBottom: '0.5rem' }}>
                Thông tin đã được điền tự động
              </div>
              <div style={{ fontSize: '1rem', color: '#b45309', lineHeight: '1.6' }}>
                Chúng tôi đã điền các thông tin từ tài khoản của bạn. Vui lòng kiểm tra và điền thêm các thông tin còn thiếu.
              </div>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)',
          border: '0.0625rem solid rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <User size={28} color="#f97316" strokeWidth={2.5} />
            Thông tin cá nhân
          </h2>

          <div style={{ marginBottom: '2rem' }} className={errors.fullName ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Họ và tên <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nhập họ và tên đầy đủ"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.fullName ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.fullName ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.fullName ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.fullName ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                handleBlur(e);
                e.target.style.borderColor = errors.fullName ? '#ef4444' : '#d1d5db';
                e.target.style.backgroundColor = errors.fullName ? '#fef2f2' : '#fafafa';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.fullName && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.fullName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }} className={errors.phone ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Số điện thoại <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.phone ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.phone ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.phone ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.phone ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                handleBlur(e);
                e.target.style.borderColor = errors.phone ? '#ef4444' : '#d1d5db';
                e.target.style.backgroundColor = errors.phone ? '#fef2f2' : '#fafafa';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.phone && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.phone}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }} className={errors.email ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Email <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ email"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.email ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.email ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.email ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.email ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                handleBlur(e);
                e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db';
                e.target.style.backgroundColor = errors.email ? '#fef2f2' : '#fafafa';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.email && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }} className={errors.idCardNumber ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Số CMND/CCCD <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="idCardNumber"
              value={formData.idCardNumber}
              onChange={handleInputChange}
              placeholder="Nhập số CMND/CCCD"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.idCardNumber ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.idCardNumber ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.idCardNumber ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.idCardNumber ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.idCardNumber && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.idCardNumber}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div style={{ marginBottom: '0' }} className={errors.idDocumentExpiryDate ? 'error-field' : ''}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Ngày hết hạn giấy tờ (CMND/CCCD)
              </label>
              <input
                type="date"
                name="idDocumentExpiryDate"
                value={formData.idDocumentExpiryDate}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  border: errors.idDocumentExpiryDate ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db', 
                  borderRadius: '0.75rem', 
                  fontSize: '1.125rem', 
                  outline: 'none',
                  backgroundColor: errors.idDocumentExpiryDate ? '#fef2f2' : '#fafafa',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = errors.idDocumentExpiryDate ? '#ef4444' : '#f97316';
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.boxShadow = errors.idDocumentExpiryDate ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
                }}
                onBlur={handleBlur}
              />
              {errors.idDocumentExpiryDate && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                  ⚠️ {errors.idDocumentExpiryDate}
                </div>
              )}
            </div>
            
          </div>

          
        </div>

        {/* Relative Contact */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)',
          border: '0.0625rem solid rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <User size={28} color="#f97316" strokeWidth={2.5} />
            Thông tin người thân
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Người thân liên hệ
              </label>
              <input 
                type="text" 
                name="relativeName" 
                value={formData.relativeName} 
                onChange={handleInputChange} 
                placeholder="Họ tên" 
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  border: '0.125rem solid #d1d5db', 
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  outline: 'none',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.boxShadow = '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ marginBottom: '2rem' }} className={errors.relativePhone ? 'error-field' : ''}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                SĐT người thân
              </label>
              <input 
                type="text" 
                name="relativePhone" 
                value={formData.relativePhone} 
                onChange={handleInputChange} 
                placeholder="Số điện thoại" 
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  border: errors.relativePhone ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db', 
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  outline: 'none',
                  backgroundColor: errors.relativePhone ? '#fef2f2' : '#fafafa',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = errors.relativePhone ? '#ef4444' : '#f97316';
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.boxShadow = errors.relativePhone ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
                }}
                onBlur={handleBlur}
              />
              {errors.relativePhone && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                  ⚠️ {errors.relativePhone}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '0' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Quan hệ
              </label>
              <select
                name="relativeRelationship"
                value={formData.relativeRelationship}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  border: '0.125rem solid #d1d5db', 
                  borderRadius: '0.75rem', 
                  background: '#fff', 
                  fontSize: '1.125rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.boxShadow = '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Chọn quan hệ</option>
                <option value="Cha/Mẹ">Cha/Mẹ</option>
                <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                <option value="Vợ/Chồng">Vợ/Chồng</option>
                <option value="Bạn bè">Bạn bè</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)',
          border: '0.0625rem solid rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <Truck size={28} color="#f97316" strokeWidth={2.5} />
            Thông tin phương tiện
          </h2>

          

          <div style={{ marginBottom: '0' }} className={errors.vehiclePlateNumber ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Biển số xe <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="vehiclePlateNumber"
              value={formData.vehiclePlateNumber}
              onChange={handleInputChange}
              placeholder="Nhập biển số xe"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.vehiclePlateNumber ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.vehiclePlateNumber ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.vehiclePlateNumber ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.vehiclePlateNumber ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.vehiclePlateNumber && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.vehiclePlateNumber}
              </div>
            )}
          </div>
        </div>

        {/* Bank Information */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)',
          border: '0.0625rem solid rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <CreditCard size={28} color="#f97316" strokeWidth={2.5} />
            Thông tin ngân hàng
          </h2>

          <div style={{ marginBottom: '1.25rem' }} className={errors.bankName ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Tên ngân hàng <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              placeholder="VD: Vietcombank, Techcombank..."
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.bankName ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.bankName ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.bankName ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.bankName ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.bankName && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.bankName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }} className={errors.bankAccountNumber ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Số tài khoản <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleInputChange}
              placeholder="Nhập số tài khoản"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.bankAccountNumber ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.bankAccountNumber ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.bankAccountNumber ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.bankAccountNumber ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.bankAccountNumber && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.bankAccountNumber}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }} className={errors.bankAccountName ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Tên chủ tài khoản <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="bankAccountName"
              value={formData.bankAccountName}
              onChange={handleInputChange}
              placeholder="Nhập tên chủ tài khoản"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.bankAccountName ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.bankAccountName ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.bankAccountName ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.bankAccountName ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.bankAccountName && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.bankAccountName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '0' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
              Tên chủ tài khoản (xác minh theo hợp đồng)
            </label>
            <input
              type="text"
              name="bankOwnerName"
              value={formData.bankOwnerName}
              onChange={handleInputChange}
              placeholder="Nhập tên chủ tài khoản theo ngân hàng"
              style={{ 
                width: '100%', 
                padding: '1rem 1.25rem', 
                border: '0.125rem solid #d1d5db', 
                borderRadius: '0.75rem', 
                fontSize: '1.125rem', 
                outline: 'none',
                backgroundColor: '#fafafa',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.backgroundColor = '#fafafa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Driver License Information */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <FileText size={28} color="#f97316" strokeWidth={2.5} />
            Thông tin giấy phép lái xe
          </h2>

          <div style={{ marginBottom: '0' }} className={errors.driverLicenseNumber ? 'error-field' : ''}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Số giấy phép lái xe <span style={{ color: '#ee4d2d', fontSize: '1.25rem' }}>*</span>
            </label>
            <input
              type="text"
              name="driverLicenseNumber"
              value={formData.driverLicenseNumber}
              onChange={handleInputChange}
              placeholder="Nhập số giấy phép lái xe"
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: errors.driverLicenseNumber ? '0.125rem solid #ef4444' : '0.125rem solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                backgroundColor: errors.driverLicenseNumber ? '#fef2f2' : '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.driverLicenseNumber ? '#ef4444' : '#f97316';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = errors.driverLicenseNumber ? '0 0 0 0.25rem rgba(239, 68, 68, 0.1)' : '0 0 0 0.25rem rgba(249, 115, 22, 0.1)';
              }}
              onBlur={handleBlur}
            />
            {errors.driverLicenseNumber && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ⚠️ {errors.driverLicenseNumber}
              </div>
            )}
          </div>
        </div>

        {/* Document Uploads */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <Camera size={28} color="#f97316" strokeWidth={2.5} />
            Hình ảnh xác thực
          </h2>

          <FileUploadBox 
            label="Ảnh đại diện" 
            fieldName="profilePhoto" 
            icon={User}
            preview={previews.profilePhoto}
            onFileChange={(e) => handleFileChange(e, 'profilePhoto')}
          />
          <FileUploadBox 
            label="Ảnh CMND/CCCD (Mặt trước)" 
            fieldName="idCardFront" 
            icon={FileText}
            preview={previews.idCardFront}
            onFileChange={(e) => handleFileChange(e, 'idCardFront')}
          />
          <FileUploadBox 
            label="Ảnh CMND/CCCD (Mặt sau)" 
            fieldName="idCardBack" 
            icon={FileText}
            preview={previews.idCardBack}
            onFileChange={(e) => handleFileChange(e, 'idCardBack')}
          />
          <FileUploadBox 
            label="Ảnh đăng ký xe" 
            fieldName="vehicleRegistration" 
            icon={FileText}
            preview={previews.vehicleRegistration}
            onFileChange={(e) => handleFileChange(e, 'vehicleRegistration')}
          />
          <FileUploadBox 
            label="Ảnh GPLX (mặt trước)" 
            fieldName="drivingLicense" 
            icon={FileText}
            preview={previews.drivingLicense}
            onFileChange={(e) => handleFileChange(e, 'drivingLicense')}
          />
          <FileUploadBox 
            label="Ảnh GPLX (mặt sau)" 
            fieldName="drivingLicenseBack" 
            icon={FileText}
            preview={previews.drivingLicenseBack}
            onFileChange={(e) => handleFileChange(e, 'drivingLicenseBack')}
          />
          {/* LLTP option selector (buttons) */}
          <div style={{ margin: '0 0 2rem 0', padding: '1.25rem', background: '#fff7ed', border: '0.125rem solid #fdba74', borderRadius: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '1rem', fontSize: '1.125rem' }}>Chọn hình thức nộp LLTP</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              width: '100%'
            }}>
              {[
                { key: 'lltp2', label: 'Nộp LLTP số 02' },
                { key: 'lltp1_combo', label: 'LLTP số 01 + Giấy hẹn số 02' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLltpOption(opt.key)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    border: lltpOption === opt.key ? '0.1875rem solid #f97316' : '0.125rem solid #fdba74',
                    borderRadius: '0.75rem',
                    background: lltpOption === opt.key ? '#ffedd5' : '#fff',
                    color: lltpOption === opt.key ? '#c2410c' : '#92400e',
                    cursor: 'pointer',
                    fontWeight: lltpOption === opt.key ? 700 : 600,
                    fontSize: '1.125rem',
                    transition: 'all 0.2s',
                    boxShadow: lltpOption === opt.key ? '0 0.25rem 1rem rgba(249, 115, 22, 0.2)' : '0 0.125rem 0.5rem rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (lltpOption !== opt.key) {
                      e.target.style.transform = 'translateY(-0.125rem)';
                      e.target.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    if (lltpOption !== opt.key) {
                      e.target.style.boxShadow = '0 0.125rem 0.5rem rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Health certificate (always required) */}
          <FileUploadBox 
            label="Giấy khám sức khỏe (bắt buộc)" 
            fieldName="healthCertificate" 
            icon={FileText}
            preview={previews.healthCertificate}
            onFileChange={(e) => handleFileChange(e, 'healthCertificate')}
          />

          {/* Conditional LLTP inputs */}
          {lltpOption === 'lltp2' ? (
            <FileUploadBox 
              label="LLTP số 02 (bắt buộc)" 
              fieldName="criminalRecord" 
              icon={FileText}
              preview={previews.criminalRecord}
              onFileChange={(e) => handleFileChange(e, 'criminalRecord')}
            />
          ) : (
            <>
              <FileUploadBox 
                label="LLTP số 01 (bắt buộc)" 
                fieldName="lltp01" 
                icon={FileText}
                preview={previews.lltp01}
                onFileChange={(e) => handleFileChange(e, 'lltp01')}
              />
              <FileUploadBox 
                label="Giấy hẹn LLTP số 02 (bắt buộc)" 
                fieldName="lltpAppointment" 
                icon={FileText}
                preview={previews.lltpAppointment}
                onFileChange={(e) => handleFileChange(e, 'lltpAppointment')}
              />
            </>
          )}
          <FileUploadBox 
            label="Bằng lái xe máy (mặt trước)" 
            fieldName="motorcycleLicenseFront" 
            icon={FileText}
            preview={previews.motorcycleLicenseFront}
            onFileChange={(e) => handleFileChange(e, 'motorcycleLicenseFront')}
          />
          <FileUploadBox 
            label="Bằng lái xe máy (mặt sau)" 
            fieldName="motorcycleLicenseBack" 
            icon={FileText}
            preview={previews.motorcycleLicenseBack}
            onFileChange={(e) => handleFileChange(e, 'motorcycleLicenseBack')}
          />
          <FileUploadBox 
            label="Ảnh minh chứng khác" 
            fieldName="proofImage" 
            icon={FileText}
            preview={previews.proofImage}
            onFileChange={(e) => handleFileChange(e, 'proofImage')}
          />
        </div>

        {/* Terms Agreement */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0.25rem 1.5rem rgba(0, 0, 0, 0.08)',
          border: agreedToTerms ? '0.125rem solid #10b981' : '0.125rem solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginTop: 0,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '0.125rem solid #e5e7eb'
          }}>
            <CheckCircle2 size={28} color="#f97316" strokeWidth={2.5} />
            Điều khoản dịch vụ
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#4b5563', marginBottom: '2rem', lineHeight: '1.6' }}>
            Vui lòng đọc và đồng ý với các điều khoản dịch vụ trước khi đăng ký.
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', padding: '1.25rem', background: '#f9fafb', borderRadius: '0.75rem', border: '0.125rem solid #e5e7eb' }}>
            <input
              type="checkbox"
              id="termsAgreement"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ width: '1.5rem', height: '1.5rem', marginTop: '0.125rem', cursor: 'pointer', accentColor: '#f97316' }}
            />
            <label htmlFor="termsAgreement" style={{ fontSize: '1.0625rem', color: '#1f2937', cursor: 'pointer', lineHeight: '1.6', fontWeight: '500' }}>
              Tôi đã đọc và đồng ý với&nbsp;
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f97316',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  padding: 0
                }}
              >
                Điều khoản dịch vụ Shipper
              </button>
            </label>
          </div>
          {!agreedToTerms && (
            <p style={{ fontSize: '1rem', color: '#ee4d2d', marginTop: '0', padding: '1rem', background: '#fee2e2', borderRadius: '0.75rem', fontWeight: '500' }}>
              ⚠️ Vui lòng đồng ý với điều khoản trước khi đăng ký
            </p>
          )}
        </div>

        {/* Button Group */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => handleSafeNavigate('/customer/profile')}
            disabled={loading}
            style={{
              padding: '1.25rem 2rem',
              background: '#fff',
              color: '#f97316',
              border: '0.125rem solid #f97316',
              borderRadius: '1rem',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0.25rem 1rem rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
              minHeight: '56px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#f97316';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.transform = 'translateY(-0.125rem)';
                e.currentTarget.style.boxShadow = '0 0.375rem 1.25rem rgba(249, 115, 22, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#f97316';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0.25rem 1rem rgba(0, 0, 0, 0.08)';
              }
            }}
          >
            ❌ Hủy
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            style={{
              padding: '1.25rem 2rem',
              background: loading || !agreedToTerms ? '#ccc' : 'linear-gradient(135deg, #f97316 0%, #ff9447 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '1rem',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: loading || !agreedToTerms ? 'not-allowed' : 'pointer',
              boxShadow: loading || !agreedToTerms ? 'none' : '0 0.375rem 1.5rem rgba(249, 115, 22, 0.4)',
              transition: 'all 0.2s',
              minHeight: '56px'
            }}
            onMouseEnter={(e) => {
              if (!loading && agreedToTerms) {
                e.currentTarget.style.transform = 'translateY(-0.125rem)';
                e.currentTarget.style.boxShadow = '0 0.5rem 2rem rgba(249, 115, 22, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && agreedToTerms) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0.25rem 1rem rgba(249, 115, 22, 0.3)';
              }
            }}
          >
            {loading ? '⏳ Đang gửi...' : '🚀 Đăng ký'}
          </button>
        </div>
      </form>
      )}

      {/* Terms Modal */}
      <ShipperTermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* Popup Notification */}
      {popup.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setPopup(prev => ({ ...prev, open: false }))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '90%',
              background: '#ffffff',
              borderRadius: '1.25rem',
              padding: '1.75rem 1.75rem 1.5rem',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.45)',
              border:
                popup.type === 'success'
                  ? '2px solid #22c55e'
                  : popup.type === 'error'
                  ? '2px solid #ef4444'
                  : '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color:
                    popup.type === 'success'
                      ? '#16a34a'
                      : popup.type === 'error'
                      ? '#b91c1c'
                      : '#0f172a',
                }}
              >
                {popup.type === 'success'
                  ? 'Thành công'
                  : popup.type === 'error'
                  ? 'Có lỗi xảy ra'
                  : 'Thông báo'}
              </div>
              <div style={{ fontSize: '1.05rem', color: '#4b5563', lineHeight: 1.6 }}>{popup.message}</div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPopup(prev => ({ ...prev, open: false }))}
                style={{
                  minWidth: '120px',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background:
                    popup.type === 'success'
                      ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
                      : popup.type === 'error'
                      ? 'linear-gradient(135deg, #ef4444 0%, #f97373 100%)'
                      : 'linear-gradient(135deg, #f97316 0%, #ff9447 100%)',
                  color: '#ffffff',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}