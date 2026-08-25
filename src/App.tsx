/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  Upload,
  Trash2,
  Filter,
  Check,
  Mail,
  User,
  Lock,
  Unlock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Grid,
  Plus,
  ExternalLink,
  Eye,
  Settings,
  Sun,
  Moon,
  MessageSquare,
  FileText,
  RefreshCw,
  LogOut,
  Sparkles,
  Folder,
  FolderOpen,
  Search,
  Download,
  Play,
  Pause,
  Share2
} from 'lucide-react';
import { storage, Photo, Category, ContactSubmission } from './utils/storage';
import { motion } from 'motion/react';

import mainLogo from './assets/images/mainlogo.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15
    }
  }
};

import jacobPortrait from "./assets/images/jacob.jpg";

export default function App() {
  // DB States
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Theme & Navigation
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab ] = useState<'home' | 'gallery' | 'about' | 'contact' | 'admin'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gallery Filters
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'camera' | 'title'>('order');
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Swipe Gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Contact Form Inputs
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Admin Security
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [pincode, setPincode] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [savedPasscode, setSavedPasscode] = useState('1994'); // Default loaded passcode
  const [showPinMask, setShowPinMask] = useState(true);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isLocalFallbackMode, setIsLocalFallbackMode] = useState(false);

  // Admin Active CMS Category inside sidebar
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'upload' | 'photos' | 'categories' | 'messages' | 'settings'>('upload');
  const [uploadMode, setUploadMode] = useState<'single' | 'dump' | 'watermark'>('single');

  // Client Side Upload Forms
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: '',
    description: '',
    isFeatured: false,
    isPublished: true,
    newCategoryName: '',
    camera: '',
    lens: '',
    iso: '',
    shutterSpeed: '',
    aperture: '',
    focalLength: ''
  });
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Admin Settings Forms
  const [settingsForm, setSettingsForm] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: ''
  });
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const aboutPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAboutPhoto, setIsUploadingAboutPhoto] = useState(false);

  // Folder Gallery state
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Photo Dump (Batch Upload) states
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchPreviews, setBatchPreviews] = useState<string[]>([]);
  const [dumpTitleStrategy, setDumpTitleStrategy] = useState<'filename' | 'prefix'>('filename');
  const [dumpTitlePrefix, setDumpTitlePrefix] = useState('');
  const [dumpDescription, setDumpDescription] = useState('');
  const [dumpIsFeatured, setDumpIsFeatured] = useState(false);
  const [dumpIsPublished, setDumpIsPublished] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; stage: string } | null>(null);

  // CMS Metadata & File Editing states
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editCamera, setEditCamera] = useState('');
  const [editLens, setEditLens] = useState('');
  const [editIso, setEditIso] = useState('');
  const [editShutterSpeed, setEditShutterSpeed] = useState('');
  const [editAperture, setEditAperture] = useState('');
  const [editFocalLength, setEditFocalLength] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  // Category Edit states
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Automatic Watermark configurations
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkConfig, setWatermarkConfig] = useState({
    text: 'MANX MEDIA',
    logoStyle: 'custom-image', // 'emblem' | 'shutter' | 'isle-of-man' | 'text-only' | 'custom-image'
    position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
    opacity: 0.85,
    scale: 0.16,
    color: '#ffffff',
    customLogoBase64: ''
  });

  // Initialize DB and load states
  useEffect(() => {
    async function initCMSData() {
      try {
        await storage.init();

        // Ask the server whether our session cookie is a valid admin session
        // (the cookie is httpOnly, so we can't just read a local flag anymore).
        let isAdmin = false;
        try {
          const checkRes = await fetch('/api/admin-check', { credentials: 'include' });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            isAdmin = !!checkData.isAdmin;
          }
        } catch (err) {
          console.warn('Admin session check failed:', err);
        }

        setIsAdminLoggedIn(isAdmin);

        // Load correct public/admin photos & categories
        const loadedPhotos = await storage.getAllPhotos(isAdmin);
        const loadedCategories = await storage.getAllCategories();
        
        setPhotos(loadedPhotos);
        setCategories(loadedCategories);
        setAboutPhotoUrl(storage.getAboutPhoto());
        
        if (loadedCategories.length > 0) {
          setUploadForm(prev => ({ ...prev, category: loadedCategories[0].name }));
        }

        if (isAdmin) {
          const loadedMessages = await storage.getAllMessages();
          setMessages(loadedMessages);
        }

        setDbReady(true);
      } catch (err) {
        setDbError('CMS local storage engine initialization failed.');
        console.error(err);
      }
    }
    initCMSData();

    // Load watermark configuration
    const savedEnabled = localStorage.getItem('manx_wm_enabled');
    if (savedEnabled !== null) {
      setWatermarkEnabled(savedEnabled === 'true');
    }
    const savedConfig = localStorage.getItem('manx_wm_config');
    if (savedConfig) {
      try {
        setWatermarkConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error parsing watermark config from localStorage', e);
      }
    }
  }, []);

  // Update dynamic body background colors
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0b0f19'; // Rich midnight slate
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; // Crisp pure porcelain slate
    }
  }, [darkMode]);

  // Read message handler
  const handleMarkMessageRead = async (msgId: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === msgId) {
        const newMsg = { ...msg, isRead: true };
        storage.markMessageRead(msgId);
        return newMsg;
      }
      return msg;
    });
    setMessages(updatedMessages);
  };

  // Delete message handler
  const handleDeleteMessage = async (msgId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      await storage.deleteMessage(msgId);
      const filtered = messages.filter(m => m.id !== msgId);
      setMessages(filtered);
    }
  };

  // Reset database handler (Emergency system restore)
  const handleFactoryReset = async () => {
    if (confirm('WARNING: This will restore the gallery to its factory default photographs and remove custom changes. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setIsSubmittingContact(true);
    try {
      const submission: ContactSubmission = {
        id: `msg-${Date.now()}`,
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject || 'General Inquiry',
        message: contactForm.message,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      await storage.submitContactMessage({
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: submission.message,
        createdAt: submission.createdAt
      });
      
      // Update UI state
      setMessages(prev => [submission, ...prev]);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });

      // Clear success banner after 5 seconds
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      alert('Error submitting message. Please retry.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Lightbox Next/Prev Navigation
  // Filtered/searched/sorted list of photos currently being shown in active gallery view
  const activePhotos = useMemo(() => {
    const targetCat = selectedFolder || selectedPhotoCategory;
    let filtered = photos;
    
    if (targetCat !== 'All') {
      filtered = photos.filter(p => p.category.toLowerCase() === targetCat.toLowerCase());
    }
    
    // Apply real-time search query (Change 1)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(q) || false;
        const descMatch = p.description?.toLowerCase().includes(q) || false;
        const cameraMatch = p.exif?.camera?.toLowerCase().includes(q) || false;
        const lensMatch = p.exif?.lens?.toLowerCase().includes(q) || false;
        const categoryMatch = p.category?.toLowerCase().includes(q) || false;
        return titleMatch || descMatch || cameraMatch || lensMatch || categoryMatch;
      });
    }

    // Apply custom criteria sorted results (Change 1)
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      }
      if (sortBy === 'camera') {
        const camA = a.exif?.camera || '';
        const camB = b.exif?.camera || '';
        return camA.localeCompare(camB);
      }
      if (sortBy === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      }
      // default: sortBy === 'order'
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return sorted;
  }, [photos, selectedPhotoCategory, selectedFolder, searchQuery, sortBy]);

  const handlePrevLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null || activePhotos.length === 0) return;
    setLightboxIndex(prev => (prev === 0 ? activePhotos.length - 1 : prev! - 1));
  };

  const handleNextLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null || activePhotos.length === 0) return;
    setLightboxIndex(prev => (prev === activePhotos.length - 1 ? 0 : prev! + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextLightbox();
    } else if (isRightSwipe) {
      handlePrevLightbox();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDownloadLightboxImage = async (e: React.MouseEvent, imageUrl: string, title: string) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (title || 'photograph').toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `manx_media_${cleanTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // CORS fallback: open in new tab with target blank trigger
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      const cleanTitle = (title || 'photograph').toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `manx_media_${cleanTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShareLightboxImage = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const fullUrl = new URL(imageUrl, window.location.origin).toString();
      await navigator.clipboard.writeText(fullUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  // Keyboard Shortcuts Hook for Lightbox navigation (Change 3)
  useEffect(() => {
    if (lightboxIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevLightbox();
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, activePhotos.length]);

  // Autoplay Slideshow Timer Hook (Change 3)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isOverlayOpen = lightboxIndex !== null;
    
    if (slideshowActive && isOverlayOpen && activePhotos.length > 0) {
      timer = setInterval(() => {
        setLightboxIndex(prev => {
          if (prev === null) return null;
          return prev === activePhotos.length - 1 ? 0 : prev + 1;
        });
      }, 3000);
    } else {
      setSlideshowActive(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [slideshowActive, lightboxIndex === null, activePhotos.length]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
      setPinError('Please enter both the administration username and password.');
      return;
    }
    setIsAuthSubmitting(true);
    setPinError(null);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsernameInput.trim(),
          password: adminPasswordInput.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        storage.isLocalMode = false;
        setIsLocalFallbackMode(false);
        // Reload the full (unfiltered) dataset now that we're authenticated.
        await storage.init();

        // Load production CMS data states
        const adminPhotos = await storage.getAllPhotos(true);
        setPhotos(adminPhotos);
        const loadedMessages = await storage.getAllMessages();
        setMessages(loadedMessages);
        setAboutPhotoUrl(storage.getAboutPhoto());
      } else {
        setPinError(data.error || 'Incorrect username or password.');
      }
    } catch (err: any) {
      console.error('Credentials login error:', err);
      setPinError('Unable to reach the secure authentication service. Verify connection.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin-logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('Admin logout request failed:', err);
    }
    setIsAdminLoggedIn(false);
    setPincode('');
    setPinError(null);
    // Reload public photos on logout
    const publicPhotos = await storage.getAllPhotos(false);
    setPhotos(publicPhotos);
  };

  const handleAboutPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingAboutPhoto(true);
    try {
      const downloadUrl = await storage.uploadImage(file, file.name);
      await storage.saveAboutPhoto(downloadUrl);
      setAboutPhotoUrl(downloadUrl);
    } catch (err) {
      console.error('About photo upload failed:', err);
      alert('Failed to upload the photo. Please try again.');
    } finally {
      setIsUploadingAboutPhoto(false);
    }
  };

  // Drag and Drop files functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) {
      alert('Only image files (.jpg, .jpeg, .png, .webp) are supported.');
      return;
    }

    // Append to batch files list
    setBatchFiles(prev => [...prev, ...images]);

    images.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const previewString = e.target.result as string;
          setBatchPreviews(prev => [...prev, previewString]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Populate backward compatible single-photo states if empty
    if (images.length === 1 && batchFiles.length === 0) {
      setSelectedFile(images[0]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(images[0]);
    }
  };

  const processFile = (file: File) => {
    processFiles([file]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset so selecting the same file (or another one right after) always fires onChange again.
    e.target.value = '';
  };

  // Automatic Watermarking and Compression Engine
  const processSingleImageAndWatermark = (
    base64Str: string,
    fileName: string,
    wmConfig: {
      enabled: boolean;
      text: string;
      logoStyle: string;
      position: string;
      opacity: number;
      scale: number;
      color: string;
      customLogoBase64?: string;
    }
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2400;
        const MAX_HEIGHT = 2400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        // 1. Draw base high-resolution image
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Overlay Watermark if active
        if (wmConfig.enabled) {
          ctx.save();

          // Scale proportion of watermark bounding context based on image size
          const minDim = Math.min(width, height);
          const wmSize = minDim * wmConfig.scale;

          // Padding boundaries
          const padding = minDim * 0.045;
          let x = 0;
          let y = 0;

          if (wmConfig.position === 'bottom-right') {
            x = width - wmSize - padding;
            y = height - wmSize - padding;
          } else if (wmConfig.position === 'bottom-left') {
            x = padding;
            y = height - wmSize - padding;
          } else if (wmConfig.position === 'top-right') {
            x = width - wmSize - padding;
            y = padding;
          } else if (wmConfig.position === 'top-left') {
            x = padding;
            y = padding;
          } else { // Center
            x = (width - wmSize) / 2;
            y = (height - wmSize) / 2;
          }

          // Apply opacity transformation and translate to center of watermark
          ctx.globalAlpha = wmConfig.opacity;
          ctx.translate(x + wmSize / 2, y + wmSize / 2);

          ctx.fillStyle = wmConfig.color;
          ctx.strokeStyle = wmConfig.color;

          const finishWatermark = () => {
             ctx.restore();
             resolve(canvas.toDataURL('image/jpeg', 0.92));
          };

          if (wmConfig.logoStyle === 'custom-image' && wmConfig.customLogoBase64) {
             const customImg = new Image();
             customImg.src = wmConfig.customLogoBase64;
             customImg.onload = () => {
               const customRatio = customImg.width / customImg.height;
               let drawW = wmSize;
               let drawH = wmSize;
               if (customRatio > 1) {
                 drawH = wmSize / customRatio;
               } else {
                 drawW = wmSize * customRatio;
               }
               ctx.drawImage(customImg, -drawW / 2, -drawH / 2, drawW, drawH);
               finishWatermark();
             };
             customImg.onerror = finishWatermark; // fallback if bad base64
             return;
          } else if (wmConfig.logoStyle === 'text-only') {
            // Draw pure elegant centered font
            ctx.font = `bold ${Math.max(12, wmSize * 0.16)}px "Inter", "Space Grotesk", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`© ${wmConfig.text}`, 0, 0);
          }

          finishWatermark();
        } else {
          const optimizedURI = canvas.toDataURL('image/jpeg', 0.92);
          resolve(optimizedURI);
        }
      };
    });
  };

  // Fallback single image compressor
  const compressImage = (base64Str: string): Promise<string> => {
    return processSingleImageAndWatermark(base64Str, 'upload.jpg', {
      enabled: watermarkEnabled,
      ...watermarkConfig
    });
  };

  // Upload validation & process
  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreview) {
      alert('Please choose or drop an image file first.');
      return;
    }

    const finalCategoryName = showNewCatInput ? uploadForm.newCategoryName.trim() : uploadForm.category;
    if (!finalCategoryName) {
      alert('Please select or specify a category for the photo.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 1, total: 1, stage: 'Compressing and watermarking...' });
    try {
      // 1. If it's a new category, create and save it first
      if (showNewCatInput) {
        const safeCatName = uploadForm.newCategoryName.trim();
        const isExisting = categories.some(c => c.name.toLowerCase() === safeCatName.toLowerCase());
        
        if (!isExisting) {
          const newCat: Category = {
            id: `cat-${Date.now()}`,
            name: safeCatName
          };
          await storage.saveCategory(newCat);
          setCategories(prev => [...prev, newCat]);
          
          setUploadForm(prev => ({
            ...prev,
            category: safeCatName,
            newCategoryName: ''
          }));
          setShowNewCatInput(false);
        }
      }

      // 2. Compress the preview from browser with watermark
      const optimizedImageBase64 = await processSingleImageAndWatermark(uploadPreview, selectedFile?.name || 'photo.jpg', {
        enabled: watermarkEnabled,
        ...watermarkConfig
      });

      // Send to S3 / Storage Provider
      const finalImageUrl = await storage.uploadImage(optimizedImageBase64, selectedFile?.name || 'photo.jpg');

      // 3. Save photo structure
      const hasExif = uploadForm.camera || uploadForm.lens || uploadForm.iso || uploadForm.shutterSpeed || uploadForm.aperture || uploadForm.focalLength;
      const exifObj = hasExif ? {
        camera: uploadForm.camera.trim() || undefined,
        lens: uploadForm.lens.trim() || undefined,
        iso: uploadForm.iso.trim() || undefined,
        shutterSpeed: uploadForm.shutterSpeed.trim() || undefined,
        aperture: uploadForm.aperture.trim() || undefined,
        focalLength: uploadForm.focalLength.trim() || undefined,
      } : undefined;

      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        title: uploadForm.title.trim() || 'Untitled Frame',
        description: uploadForm.description.trim() || 'No description supplied.',
        category: showNewCatInput ? uploadForm.newCategoryName.trim() : uploadForm.category,
        imageUrl: finalImageUrl,
        isFeatured: uploadForm.isFeatured,
        isPublished: uploadForm.isPublished,
        order: photos.length,
        exif: exifObj,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await storage.savePhoto(newPhoto);
      
      // Update local states
      setPhotos(prev => [newPhoto, ...prev]);
      setUploadSuccess(true);

      // Reset forms
      setSelectedFile(null);
      setUploadPreview(null);
      setBatchFiles([]);
      setBatchPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadForm(prev => ({
        ...prev,
        title: '',
        description: '',
        isFeatured: false,
        isPublished: true,
        camera: '',
        lens: '',
        iso: '',
        shutterSpeed: '',
        aperture: '',
        focalLength: ''
      }));

      setTimeout(() => setUploadSuccess(false), 4000);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Batch Multi-Photo Upload (Photo Dump) Controller
  const handleBatchPhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0) {
      alert('Please select or drag at least one photograph to dump.');
      return;
    }

    const finalCategoryName = showNewCatInput ? uploadForm.newCategoryName.trim() : uploadForm.category;
    if (!finalCategoryName) {
      alert('Please select or specify a category folder for the photo dump.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      current: 1,
      total: batchFiles.length,
      stage: 'Initiating portfolio photo dump...'
    });

    try {
      // 1. Save new category if needed
      let activeCategory = finalCategoryName;
      if (showNewCatInput) {
        const safeCatName = uploadForm.newCategoryName.trim();
        const isExisting = categories.some(c => c.name.toLowerCase() === safeCatName.toLowerCase());
        
        if (!isExisting) {
          const newCat: Category = {
            id: `cat-${Date.now()}`,
            name: safeCatName
          };
          await storage.saveCategory(newCat);
          setCategories(prev => [...prev, newCat]);
          
          setUploadForm(prev => ({
            ...prev,
            category: safeCatName,
            newCategoryName: ''
          }));
          setShowNewCatInput(false);
          activeCategory = safeCatName;
        }
      }

      const newlyAddedPhotos: Photo[] = [];

      // 2. Loop and process images in sequence
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const rawPreview = batchPreviews[i];

        setUploadProgress({
          current: i + 1,
          total: batchFiles.length,
          stage: `Compressing & Watermarking [${i + 1}/${batchFiles.length}]: "${file.name}"...`
        });

        // Overlay watermark on active file canvas
        const watermarkedBase64 = await processSingleImageAndWatermark(rawPreview, file.name, {
          enabled: watermarkEnabled,
          ...watermarkConfig
        });

        // Send to Storage Provider (S3)
        setUploadProgress({
          current: i + 1,
          total: batchFiles.length,
          stage: `Saving to storage [${i + 1}/${batchFiles.length}]: "${file.name}"...`
        });

        const finalImageUrl = await storage.uploadImage(watermarkedBase64, file.name);

        // Determine title strategy
        let formattedTitle = 'Untitled';
        if (dumpTitleStrategy === 'filename') {
          // e.g. "classic_porsche_mist.jpg" -> "Classic Porsche Mist"
          const baseNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          formattedTitle = baseNoExt
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        } else {
          // Series: e.g. "Isle of Man Rally" -> "Isle of Man Rally #1"
          formattedTitle = `${dumpTitlePrefix.trim() || 'Frame'} #${i + 1}`;
        }

        const newPhoto: Photo = {
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          title: formattedTitle,
          description: dumpDescription.trim() || 'No description supplied.',
          category: activeCategory,
          imageUrl: finalImageUrl,
          isFeatured: dumpIsFeatured,
          isPublished: dumpIsPublished,
          order: photos.length + i,
          createdAt: new Date(Date.now() - i * 1000).toISOString(),
          updatedAt: new Date(Date.now() - i * 1000).toISOString()
        };

        newlyAddedPhotos.push(newPhoto);
      }

      // 3. One single write to the database for the whole batch (instead of
      // one request per photo). Throws if it didn't actually save, so we can
      // tell the user honestly rather than reporting false success.
      setUploadProgress({
        current: batchFiles.length,
        total: batchFiles.length,
        stage: `Saving ${newlyAddedPhotos.length} photo(s) to your gallery...`
      });
      await storage.savePhotosBulk(newlyAddedPhotos);

      // 4. Update states
      setPhotos(prev => [...newlyAddedPhotos, ...prev]);
      setUploadSuccess(true);

      // Reset dump-specific forms
      setBatchFiles([]);
      setBatchPreviews([]);
      if (batchFileInputRef.current) batchFileInputRef.current.value = '';
      setDumpTitlePrefix('');
      setDumpDescription('');
      setDumpIsFeatured(false);
      setDumpIsPublished(true);

      // Pre-select category just created
      setUploadForm(prev => ({ ...prev, category: activeCategory }));

      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      const detail = err?.message ? `\n\nDetails: ${err.message}` : '';
      alert(`Upload failed — your photos were NOT saved to the gallery. Your selected files are still queued below, so you can try clicking Upload again.${detail}`);
      console.error('Batch photo dump failed:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (photoId: string) => {
    if (confirm('Are you sure you want to permanently delete this photograph from your portfolio?')) {
      await storage.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    }
  };

  // Toggle photo featured attribute
  const handleToggleFeatured = async (photo: Photo) => {
    const updated: Photo = { ...photo, isFeatured: !photo.isFeatured };
    await storage.savePhoto(updated);
    setPhotos(prev => prev.map(p => p.id === photo.id ? updated : p));
  };

  const handleTogglePublished = async (photo: Photo) => {
    const updated: Photo = { ...photo, isPublished: !photo.isPublished };
    await storage.savePhoto(updated);
    setPhotos(prev => prev.map(p => p.id === photo.id ? updated : p));
  };

  const handleReorderPhoto = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) {
      return;
    }
    const newPhotos = [...photos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the elements
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[swapIndex];
    newPhotos[swapIndex] = temp;
    
    // Update their order values (using array position)
    newPhotos.forEach((p, i) => {
      p.order = i;
    });

    setPhotos(newPhotos);

    // Save both to backend. Use a simple sequence here.
    await storage.savePhoto(newPhotos[index]);
    await storage.savePhoto(newPhotos[swapIndex]);
  };

  // Admin Manage Category tab
  const [newCatName, setNewCatName] = useState('');
  const handleCreateCategoryAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmed = newCatName.trim();
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists.');
      return;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed
    };

    await storage.saveCategory(newCat);
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
  };

  const handleDeleteCategoryAdmin = async (catId: string, catName: string) => {
    const activeInCategory = photos.some(p => p.category.toLowerCase() === catName.toLowerCase());
    if (activeInCategory) {
      alert(`Cannot delete category "${catName}" because there are active photos assigned to it. Recategorize or delete those photos first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      await storage.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
    }
  };

  const handleRenameCategoryAdmin = async (catId: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('Category name cannot be empty.');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingCatId(null);
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== catId)) {
      alert(`A category named "${trimmed}" already exists.`);
      return;
    }

    try {
      const cat = categories.find(c => c.id === catId);
      const catOrder = cat?.order || 0;

      await storage.saveCategory({ id: catId, name: trimmed, order: catOrder });
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: trimmed } : c));

      // Propagate category rename to all photos in the renamed category
      const matchingPhotos = photos.filter(p => p.category.toLowerCase() === oldName.toLowerCase());
      if (matchingPhotos.length > 0) {
        for (const p of matchingPhotos) {
          const updatedPhoto = { ...p, category: trimmed };
          await storage.savePhoto(updatedPhoto);
        }
        setPhotos(prev => prev.map(p => p.category.toLowerCase() === oldName.toLowerCase() ? { ...p, category: trimmed } : p));
      }

      setEditingCatId(null);
    } catch (err) {
      alert('Failed to rename album.');
    }
  };

  // Open Edit Photo Modal
  const startEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditDescription(photo.description);
    setEditCategory(photo.category);
    setEditIsPublished(photo.isPublished !== false); // default to true if undefined
    setEditIsFeatured(photo.isFeatured === true);
    setEditCamera(photo.exif?.camera || '');
    setEditLens(photo.exif?.lens || '');
    setEditIso(photo.exif?.iso || '');
    setEditShutterSpeed(photo.exif?.shutterSpeed || '');
    setEditAperture(photo.exif?.aperture || '');
    setEditFocalLength(photo.exif?.focalLength || '');
    setEditFile(null);
    setEditPreview(null);
  };

  // Photo Editor submit
  const handleEditPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setIsEditingSaving(true);
    try {
      let finalUrl = editingPhoto.imageUrl;

      // Check if user uploaded a replacement file
      if (editPreview && editFile) {
        // Compress and watermark the file
        const optimizedReplacement = await processSingleImageAndWatermark(editPreview, editFile.name, {
          enabled: watermarkEnabled,
          ...watermarkConfig
        });
        // Upload to Storage Provider
        finalUrl = await storage.uploadImage(optimizedReplacement, editFile.name);
      }

      const hasExif = editCamera || editLens || editIso || editShutterSpeed || editAperture || editFocalLength;
      const exifObj = hasExif ? {
        camera: editCamera.trim() || undefined,
        lens: editLens.trim() || undefined,
        iso: editIso.trim() || undefined,
        shutterSpeed: editShutterSpeed.trim() || undefined,
        aperture: editAperture.trim() || undefined,
        focalLength: editFocalLength.trim() || undefined,
      } : undefined;

      const updatedPhoto: Photo = {
        ...editingPhoto,
        title: editTitle.trim() || 'Untitled Frame',
        description: editDescription.trim() || 'No description supplied.',
        category: editCategory,
        imageUrl: finalUrl,
        isPublished: editIsPublished,
        isFeatured: editIsFeatured,
        exif: exifObj,
        updatedAt: new Date().toISOString()
      };

      await storage.savePhoto(updatedPhoto);
      setPhotos(prev => prev.map(p => p.id === editingPhoto.id ? updatedPhoto : p));
      setEditingPhoto(null);
    } catch (err) {
      alert('Failed to update photograph attributes. Ensure storage configurations are available.');
      console.error(err);
    } finally {
      setIsEditingSaving(false);
    }
  };



  // Filter values
  const featuredPhotos = useMemo(() => {
    return photos.filter(p => p.isFeatured);
  }, [photos]);

  const uniqueCategoriesList = useMemo(() => {
    return ['All', ...categories.map(c => c.name)];
  }, [categories]);

  const folderAlbums = useMemo(() => {
    return categories.map(cat => {
      const catPhotos = photos.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
      return {
        id: cat.id,
        name: cat.name,
        count: catPhotos.length,
        coverUrl: catPhotos.length > 0 ? catPhotos[0].imageUrl : null,
        updatedAt: catPhotos.length > 0 ? new Date(Math.max(...catPhotos.map(p => new Date(p.createdAt).getTime()))) : null
      };
    });
  }, [categories, photos]);

  // Display stats
  const totalUnreadMessages = useMemo(() => {
    return messages.filter(m => !m.isRead).length;
  }, [messages]);

  // If DB error, explain cleanly
  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
          <Camera className="w-16 h-16 mx-auto text-amber-500 mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold tracking-tight mb-2">Database Initialization Error</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{dbError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-amber-500 hover:bg-amber-600 transition-colors py-3 font-semibold rounded-lg text-slate-900 text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const seoData = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return {
          title: 'Manx Media | Isle of Man Professional Photographer',
          description: 'Explore fine-art landscapes, automotive, portrait, and commercial photography across the Isle of Man by Jacob Crowe. Book a session, browse our prints, or view our curated highlights.',
          keywords: ['Isle of Man', 'photographer', 'fine art', 'landscape photography', 'Jacob Crowe', 'Manx Media', 'automotive photography', 'commercial camera', 'premium framing', 'prints']
        };
      case 'gallery':
        return {
          title: 'Fine-Art Photography Gallery | Manx Media',
          description: 'Browse the full collection of stunning creative photographs and curated Isle of Man landscape, heritage, and automotive albums captured by Jacob Crowe.',
          keywords: ['photography gallery', 'Isle of Man prints', 'landscapes', 'wildlife gallery', 'creative frames', 'high-resolution photography', 'portfolio']
        };
      case 'about':
        return {
          title: 'Meet Jacob Crowe | About the Photographer | Manx Media',
          description: 'Learn about Jacob Crowe, the photographer and filmmaker behind Manx Media. Read about his artistic approach, camera gear, inspiration, and love for the Manx landscape.',
          keywords: ['Jacob Crowe', 'about photographer', 'bio', 'camera gear', 'professional camera Isle of Man', 'creative vision', 'photography background']
        };
      case 'contact':
        return {
          title: 'Book a Shoot & Contact | Manx Media',
          description: 'Get in touch with Jacob Crowe to discuss custom shoots, commercial licensing, brand partnerships, premium print orders, or other photography inquiries.',
          keywords: ['contact photographer', 'email Jacob Crowe', 'book shoot', 'wedding photography Isle of Man', 'hire photographer', 'portrait booking', 'inquiry form']
        };
      case 'admin':
        return {
          title: 'Administrative CMS Portal | Manx Media',
          description: 'Secure, modern content management interface for managing public categories, full-resolution image uploads, automatic watermarks, and client messages.',
          keywords: ['CMS', 'admin', 'photography dashboard', 'secure portal', 'login']
        };
      default:
        return {
          title: 'Manx Media | Fine-Art Photography',
          description: 'Stunning creative frames and professional photography from the Isle of Man by Jacob Crowe.',
          keywords: ['Isle of Man', 'professional photography', 'Jacob Crowe']
        };
    }
  }, [activeTab]);

  return (
    <div id="manx-media-app" className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'text-slate-100 bg-slate-950' : 'text-slate-950 bg-slate-50'}`}>
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords.join(', ')} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* HEADER SECTION --- MULTI BRANDING & MODE TOGGLES */}
      <header id="portfolio-header" className={`border-b sticky top-0 z-40 transition-colors backdrop-blur-md ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          
          {/* Logo with Integrated Vector Shutter Badge */}
          <div 
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }} 
            className="cursor-pointer group flex items-center gap-3.5 focus:outline-none select-none"
            id="brand-logo"
            tabIndex={0}
          >
            <img
              src={mainLogo} 
              alt="Main Logo" 
              className="w-11 h-11 md:w-12 md:h-12 shrink-0 object-contain transition-transform duration-500 group-hover:rotate-6 sm:group-hover:rotate-12 md:group-hover:scale-108" 
            />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase leading-none">
                MANX <span className="text-blue-500 dark:text-blue-400 font-extrabold group-hover:text-blue-600 dark:group-hover:text-sky-350 transition-colors">MEDIA</span>
              </h1>
              <p className={`text-[9px] md:text-[10px] font-bold tracking-[0.14em] uppercase ${darkMode ? 'text-slate-400 group-hover:text-sky-400' : 'text-slate-500 group-hover:text-blue-600'} transition-colors mt-1`}>
                Photography by Jacob Crowe
              </p>
            </div>
          </div>

          {/* Desktop Controls Navbar */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-wider uppercase">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`pb-1 hover:text-blue-500 dark:hover:text-sky-400 transition-colors border-b-2 ${activeTab === 'home' ? 'text-blue-500 dark:text-sky-400 border-blue-550 dark:border-sky-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
              id="nav-home"
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('gallery')} 
              className={`pb-1 hover:text-blue-500 dark:hover:text-sky-400 transition-colors border-b-2 ${activeTab === 'gallery' ? 'text-blue-500 dark:text-sky-400 border-blue-550 dark:border-sky-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
              id="nav-gallery"
            >
              Gallery
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`pb-1 hover:text-blue-500 dark:hover:text-sky-400 transition-colors border-b-2 ${activeTab === 'about' ? 'text-blue-500 dark:text-sky-400 border-blue-550 dark:border-sky-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
              id="nav-about"
            >
              About
            </button>
            <button 
              onClick={() => setActiveTab('contact')} 
              className={`pb-1 hover:text-blue-500 dark:hover:text-sky-400 transition-colors border-b-2 ${activeTab === 'contact' ? 'text-blue-500 dark:text-sky-400 border-blue-550 dark:border-sky-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
              id="nav-contact"
            >
              Contact
            </button>
            
            <span className={`h-4 w-px ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />

            {/* Admin trigger */}
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`hover:text-blue-500 dark:hover:text-sky-400 flex items-center gap-1.5 focus:outline-none transition-all py-1.5 px-3.5 rounded-full text-[11px] font-bold ${activeTab === 'admin' ? 'bg-blue-500/10 text-blue-550 dark:text-sky-400 font-extrabold border-blue-500/30' : 'bg-transparent border border-slate-300 dark:border-slate-800'}`}
              id="nav-admin-gate"
              title="Admin CMS Gate"
            >
              {isAdminLoggedIn ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>CMS Portal</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* Dark & Light Theme Switch */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full border focus:outline-none transition-colors duration-200 cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-900 text-sky-400' : 'border-slate-300 hover:bg-slate-100 text-blue-900'}`}
              title={darkMode ? "Switch to Refined Light Mode" : "Switch to Deep Dark Mode"}
              id="theme-switcher-desktop"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>

          {/* Mobile responsive triggers */}
          <div className="flex md:hidden items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full border cursor-pointer ${darkMode ? 'border-slate-800 text-sky-400 bg-slate-900' : 'border-slate-300 text-blue-950 bg-slate-100'}`}
              id="theme-switcher-mobile"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className={`p-2 rounded-md ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-200'}`}
              id="mobile-menu-trigger"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>

        {/* Mobile dropdown menu body */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t py-4 px-6 absolute left-0 right-0 shadow-lg ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} transition-all flex flex-col space-y-4 font-semibold text-sm uppercase tracking-wide z-50`} id="mobile-menu-body">
            <button 
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }} 
              className={`text-left py-2 hover:text-blue-500 dark:hover:text-sky-400 ${activeTab === 'home' ? 'text-blue-500 dark:text-sky-400 pl-2 border-l-2 border-blue-500 dark:border-sky-400' : 'text-slate-400'}`}
            >
              Home
            </button>
            <button 
              onClick={() => { setActiveTab('gallery'); setMobileMenuOpen(false); }} 
              className={`text-left py-2 hover:text-blue-500 dark:hover:text-sky-400 ${activeTab === 'gallery' ? 'text-blue-500 dark:text-sky-400 pl-2 border-l-2 border-blue-500 dark:border-sky-400' : 'text-slate-400'}`}
            >
              Gallery
            </button>
            <button 
              onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }} 
              className={`text-left py-2 hover:text-blue-500 dark:hover:text-sky-400 ${activeTab === 'about' ? 'text-blue-500 dark:text-sky-400 pl-2 border-l-2 border-blue-500 dark:border-sky-400' : 'text-slate-400'}`}
            >
              About
            </button>
            <button 
              onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); }} 
              className={`text-left py-2 hover:text-blue-500 dark:hover:text-sky-400 ${activeTab === 'contact' ? 'text-blue-500 dark:text-sky-400 pl-2 border-l-2 border-blue-500 dark:border-sky-400' : 'text-slate-400'}`}
            >
              Contact
            </button>
            <div className={`h-px w-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <button 
              onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} 
              className={`text-left py-2 flex items-center gap-2 hover:text-blue-500 dark:hover:text-sky-400 ${activeTab === 'admin' ? 'text-blue-500 dark:text-sky-400 font-extrabold' : 'text-slate-400'}`}
            >
              {isAdminLoggedIn ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-500" />
                  <span>Admin Panel (CMS Active)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Admin Identity Login</span>
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1">

        {/* =============================================================== */}
        {/* TAB 1: HOME PAGE */}
        {/* =============================================================== */}
        {activeTab === 'home' && (
          <section id="section-home" className="animate-fadeIn">
            {/* Full width Cinematic hero screen */}
            <div className="relative h-[85vh] md:h-[90vh] overflow-hidden flex items-center justify-center bg-black">
              {/* Background scale animation */}
              <div className="absolute inset-0 z-0">
                {photos.length > 0 ? (
                  <img 
                    src={photos[0].imageUrl} 
                    alt="Cinematic background" 
                    className="w-full h-full object-cover opacity-60 scale-105 filter saturate-[0.8]"
                    referrerPolicy="no-referrer"
                    id="hero-backdrop-img"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
              </div>

              {/* Centered Hero Content */}
              <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white flex flex-col items-center">
                <span className="bg-blue-600/10 text-blue-450 border border-blue-500/25 dark:bg-blue-500/10 dark:text-sky-400 dark:border-sky-500/20 uppercase tracking-[0.4em] text-[10px] md:text-xs font-black py-1.5 px-4 rounded-full mb-6 select-none animate-pulse">
                  Atmospheric Storytelling
                </span>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-tight leading-none uppercase mb-6 md:mb-8 font-sans drop-shadow-md">
                  CINEMATIC <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-450 via-sky-400 to-white">Composition</span>
                </h2>
                <p className="text-sm md:text-lg text-slate-300 tracking-wide max-w-2xl font-serif italic mb-10 select-none drop-shadow leading-relaxed">
                  "Exploring high-contrast compositions, moody weather narratives, and fine-art portraits along deep-cut coastlines."
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setActiveTab('gallery')}
                    className="group bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold tracking-widest text-xs uppercase text-white py-4 px-8 rounded-lg flex items-center justify-center gap-2.5 shadow-xl hover:-translate-y-0.5 cursor-pointer animate-none"
                    id="hero-explore-cta"
                  >
                    <span>Explore Gallery</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('contact')}
                    className="border border-slate-300 hover:border-blue-500 hover:bg-slate-900/30 transition-all font-bold tracking-widest text-xs uppercase text-white py-4 px-8 rounded-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    Get in touch
                  </button>
                </div>
              </div>
            </div>

            {/* Aesthetic Narrative Intro Row */}
            <div className={`py-20 border-b ${darkMode ? 'border-slate-900 bg-slate-950' : 'border-slate-200 bg-white'}`}>
              <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="max-w-3xl mx-auto flex flex-col items-center">
                  <Camera className="w-10 h-10 text-blue-550 dark:text-sky-450 mb-6" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-blue-600 dark:text-sky-400 mb-4">
                    The Artist Vision
                  </h3>
                  <p className={`text-xl md:text-2xl font-sans tracking-wide leading-relaxed font-light ${darkMode ? 'text-slate-100' : 'text-slate-900'} mb-8`}>
                    "I believe a photograph should hold the temperature of the air, the rustle of the sea gales, and the depth of the shadows. Manx Media is structured around clean minimalism and visual weight."
                  </p>
                  <div className="flex items-center space-x-3 text-sm tracking-widest text-slate-500 uppercase font-semibold">
                    <span>Isle of Man</span>
                    <span>•</span>
                    <span>Digital & Analog</span>
                    <span>•</span>
                    <span>Visual Depth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Selection Header */}
            <div className="py-24 max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
                <div>
                  <span className="text-blue-600 dark:text-sky-450 text-xs font-bold tracking-[0.4em] uppercase block mb-3">
                    Curated Collection
                  </span>
                  <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase">
                    Featured Photography
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveTab('gallery')}
                  className="text-blue-500 dark:text-sky-400 font-bold hover:text-blue-600 dark:hover:text-sky-350 text-sm tracking-widest uppercase flex items-center gap-2 mt-4 md:mt-0 transition-all cursor-pointer"
                >
                  <span>View All Categories</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Featured Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="featured-grid">
                {featuredPhotos.length === 0 ? (
                  <div className="col-span-1 md:col-span-3 text-center py-12 text-slate-500">
                    <p className="text-sm">No photos have been favorited as "Featured" yet.</p>
                  </div>
                ) : (
                  featuredPhotos.slice(0, 3).map((photo, idx) => (
                    <div 
                      key={`${photo.id}-${idx}`}
                      onClick={() => {
                        setSelectedPhotoCategory('All');
                        const indexInAll = photos.findIndex(p => p.id === photo.id);
                        if (indexInAll !== -1) setLightboxIndex(indexInAll);
                      }}
                      className={`group cursor-pointer rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${darkMode ? 'border-slate-900 bg-slate-900/40' : 'border-slate-200 bg-white'}`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img 
                          src={photo.imageUrl} 
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {photo.isFeatured && (
                          <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur text-sky-450 text-[10px] font-bold tracking-wider uppercase py-1 px-3 rounded-full flex items-center gap-1 border border-sky-500/20 shadow-md">
                            <Sparkles className="w-3 h-3 text-sky-400 fill-sky-400" />
                            <span>Featured</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 text-[9px] font-black tracking-widest uppercase py-0.5 px-2.5 rounded-md shadow-md">
                          {photo.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-extrabold text-lg uppercase tracking-wide mb-1 leading-snug group-hover:text-blue-550 dark:group-hover:text-sky-400 transition-colors">
                          {photo.title}
                        </h4>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} line-clamp-2 leading-relaxed`}>
                          {photo.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 2: PORTFOLIO GALLERY */}
        {/* =============================================================== */}
        {activeTab === 'gallery' && (
          <section id="section-gallery" className="py-20 animate-fadeIn max-w-7xl mx-auto px-6">
            
            {/* Header intro */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-600 dark:text-sky-455 text-xs font-bold tracking-[0.4em] uppercase block mb-3 animate-pulse">
                Captured Frames
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase mb-4">
                Creative Portfolio
              </h2>
              <p className={`text-sm md:text-base leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Filter through category albums. Every piece is shot, formatted, and optimized by Manx Media, capturing Isle of Man environments, automotive cinematography, and fine-art portraits.
              </p>
            </div>

            {/* Folder Navigation path indicators */}
            {selectedFolder ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b dark:border-slate-850 border-slate-200 pb-5">
                <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-black tracking-widest uppercase text-slate-500">
                  <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => setSelectedFolder(null)}>All Folders</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                  <span className="text-blue-600 dark:text-sky-400 flex items-center gap-1.5 font-black">
                    <FolderOpen className="w-4 h-4" /> {selectedFolder}
                  </span>
                  <span className="text-[10px] font-mono lowercase tracking-normal font-normal text-slate-500">
                    ({activePhotos.length} photographs inside)
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedFolder(null)}
                  className={`flex items-center gap-2 text-2xs uppercase tracking-widest font-black py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white shadow-lg shadow-black/20' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold shadow-sm'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back To Folder Deck</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b dark:border-slate-850 border-slate-200 pb-4">
                  <div className="text-left">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Library Index Mode</h3>
                    <p className="text-[11px] text-slate-505 uppercase tracking-widest mt-0.5">Select a secure folder capsule, or switch dynamic streams</p>
                  </div>
                  
                  {/* Flat categories selector tabs */}
                  <div className="flex flex-wrap justify-center items-center gap-2" id="gallery-category-tabs">
                    {uniqueCategoriesList.map((catName) => (
                      <button
                        key={catName}
                        onClick={() => setSelectedPhotoCategory(catName)}
                        className={`py-2 px-3.5 select-none rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
                          selectedPhotoCategory.toLowerCase() === catName.toLowerCase()
                            ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-md'
                            : darkMode
                              ? 'border-slate-850 bg-slate-900/40 text-slate-450 hover:text-white hover:border-slate-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:text-black hover:border-slate-300'
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Unified Search and Sort Panel */}
            <div className="mb-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4 w-full" id="search-sort-controls">
              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Search className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  placeholder="Search metadata, titles, cameras, lenses, focal settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl text-xs font-semibold border font-sans tracking-wide transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-slate-900/40 border-slate-900 text-slate-200 focus:border-slate-700 placeholder:text-slate-500' 
                      : 'bg-white border-slate-200 text-slate-700 focus:border-blue-400 placeholder:text-slate-400 shadow-2xs'
                  }`}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 hover:text-red-500 text-slate-500 text-2xs font-extrabold font-sans uppercase tracking-[0.15em] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className={`py-3 px-4 border rounded-xl text-2xs font-bold tracking-wider uppercase transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto ${
                    darkMode 
                      ? 'bg-slate-900/40 border-slate-900 text-slate-250 focus:border-slate-700 cursor-pointer' 
                      : 'bg-white border-slate-200 text-slate-650 focus:border-blue-400 cursor-pointer shadow-2xs'
                  }`}
                >
                  <option value="order">Custom Order</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="camera">Camera Model</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* FOLDER DECK VIEW IN HOME PORTFOLIO */}
            {!selectedFolder && selectedPhotoCategory === 'All' && !searchQuery.trim() && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-fadeIn" id="visual-folders-deck">
                {folderAlbums.map((folder) => {
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.name)}
                      className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden cursor-pointer select-none ${darkMode ? 'bg-slate-900/10 border-slate-900/80 hover:border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'}`}
                    >
                      {/* Interactive tab folder design layout graphic */}
                      <div className="p-5 flex items-center justify-between border-b dark:border-slate-900 border-slate-100">
                        <div className="flex items-center gap-3">
                          <Folder className="w-7 h-7 text-blue-550 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                          <div className="text-left font-sans">
                            <h4 className="font-extrabold uppercase text-xs tracking-wider group-hover:text-blue-600 dark:group-hover:text-sky-350 transition-colors">
                              {folder.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">
                              {folder.count} Creative Frames
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full">
                          Open Folder
                        </span>
                      </div>

                      {/* Cover Photo Capsule Preview inside Folder */}
                      <div className="relative aspect-video overflow-hidden bg-slate-950/20">
                        {folder.coverUrl ? (
                          <>
                            <img
                              src={folder.coverUrl}
                              alt={folder.name}
                              className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 group-hover:scale-102"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-slate-950/10" />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-600">
                            <Camera className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-[9px] uppercase tracking-wider font-bold">No photographs uploaded</p>
                          </div>
                        )}
                      </div>

                      {/* Footer folder info indicators */}
                      <div className="p-4 bg-slate-900/10 dark:bg-slate-950/40 text-left flex justify-between items-center border-t dark:border-slate-900/80 border-slate-100">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                          {folder.updatedAt ? `Last active: ${folder.updatedAt.toLocaleDateString()}` : 'Empty Album'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dynamic Grid Rendering (Matches active photos) */}
            {(!selectedFolder && selectedPhotoCategory !== 'All') || selectedFolder || searchQuery.trim() ? (
              <div>
                {/* Masonry or flexible flex spacing Grid */}
                {activePhotos.length === 0 ? (
                  <div className="text-center py-24 border border-dashed rounded-2xl dark:border-slate-850 border-slate-300">
                    <Camera className="w-12 h-12 text-slate-405 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold tracking-wide uppercase mb-1">Album is Empty</h3>
                    <p className="text-xs text-slate-400 relative mb-4">No photos matches this filter state. Add one through the admin portal.</p>
                  </div>
                ) : (
                  <motion.div 
                    key={`${selectedFolder || 'all'}-${selectedPhotoCategory}-${searchQuery}-${sortBy}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]" 
                    id="masonry-gallery-container"
                  >
                    {activePhotos.map((photo, index) => {
                      return (
                        <motion.div 
                          key={`${photo.id}-${index}`}
                          variants={itemVariants}
                          onClick={() => setLightboxIndex(index)}
                          className={`break-inside-avoid relative group rounded-2xl overflow-hidden border cursor-pointer font-sans transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${darkMode ? 'bg-slate-900/40 border-slate-900/80' : 'bg-white border-slate-200 shadow-sm'}`}
                          id={`gallery-item-${photo.id}`}
                        >
                          <img 
                            src={photo.imageUrl} 
                            alt={photo.title}
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-102"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Interactive sleek hover frame mask */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white text-left">
                            <span className="bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-955 font-black tracking-widest text-[8px] uppercase py-0.5 px-2 rounded w-fit mb-2">
                              {photo.category}
                            </span>
                            <h4 className="font-extrabold text-base md:text-lg uppercase tracking-wide leading-tight mb-1">
                              {photo.title}
                            </h4>
                            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                              {photo.description}
                            </p>
                          </div>

                          {/* Default lightweight description bar when not hovering */}
                          <div className="p-4 md:hidden border-t dark:border-slate-800/60 border-slate-200/60">
                            <h4 className="text-sm font-bold uppercase tracking-wide">{photo.title}</h4>
                            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-505">
                              <span>{photo.category}</span>
                              <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            ) : (
              // Case selectedPhotoCategory is 'All' but selectedFolder is null (we might still want to list all pictures below the folders deck for seamless unified scrolling)
              <div className="mt-16 border-t dark:border-slate-900 border-slate-200 pt-16">
                <div className="flex justify-between items-center mb-8">
                  <div className="text-left">
                    <h3 className="text-sm font-black uppercase tracking-widest">Continuous Stream Index</h3>
                    <p className="text-2xs text-slate-500 uppercase tracking-widest mt-1">Unified view containing all {photos.length} captured units</p>
                  </div>
                </div>

                <motion.div 
                  key="continuous-stream-index"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]" 
                  id="masonry-all-container"
                >
                  {photos.map((photo, index) => {
                    const originalIndex = photos.findIndex(p => p.id === photo.id);
                    return (
                      <motion.div 
                        key={`${photo.id}-${index}`}
                        variants={itemVariants}
                        onClick={() => {
                          setSelectedPhotoCategory('All');
                          setSelectedFolder(null);
                          setSearchQuery('');
                          setLightboxIndex(originalIndex);
                        }}
                        className={`break-inside-avoid relative group rounded-2xl overflow-hidden border cursor-pointer font-sans transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${darkMode ? 'bg-slate-900/40 border-slate-900/80' : 'bg-white border-slate-200 shadow-sm'}`}
                        id={`gallery-stream-${photo.id}`}
                      >
                        <img 
                          src={photo.imageUrl} 
                          alt={photo.title}
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white text-left">
                          <span className="bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-955 font-black tracking-widest text-[8px] uppercase py-0.5 px-2 rounded w-fit mb-2">
                            {photo.category}
                          </span>
                          <h4 className="font-extrabold text-base md:text-lg uppercase tracking-wide leading-tight mb-1">
                            {photo.title}
                          </h4>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                            {photo.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </section>
        )}

        
        {/* =============================================================== */}
        {/* TAB 3: ABOUT JACOB CROWE */}
        {/* =============================================================== */}
        {activeTab === 'about' && (
          <section id="section-about" className="py-20 animate-fadeIn max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Heavy High-End Portrait image Frame */}
              <div className="md:col-span-5 relative" id="about-photo-wrapper">
                <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-blue-500/40 dark:border-sky-500/30 rounded-tl-xl" />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-blue-500/40 dark:border-sky-500/30 rounded-br-xl" />

                {aboutPhotoUrl ? (
                  <img
                    src={aboutPhotoUrl}
                    alt="Jacob Crowe Portrait"
                    className="w-full aspect-[4/5] object-cover rounded-xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src={jacobPortrait}
                    alt="Jacob Crowe Portrait"
                    className="w-full aspect-[4/5] object-cover rounded-xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
                  />
                )}

                {isAdminLoggedIn && (
                  <>
                    <input
                      ref={aboutPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAboutPhotoChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => aboutPhotoInputRef.current?.click()}
                      disabled={isUploadingAboutPhoto}
                      className="absolute z-20 bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-colors"
                    >
                      {isUploadingAboutPhoto ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          Replace Photo
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Right Column: Bio detailing Manx Media & TikTok */}
              <div className="md:col-span-7 flex flex-col space-y-6">
                <div>
                  <span className="text-blue-600 dark:text-sky-450 text-xs font-bold tracking-[0.4em] uppercase block mb-3">
                    Behind the Lens
                  </span>
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase leading-none">
                    Jacob Crowe
                  </h2>
                  <p className="text-blue-600 dark:text-sky-400 text-sm font-semibold tracking-wider font-sans uppercase mt-1">
                    Creator of Manx Media
                  </p>
                </div>

                <div className={`space-y-4 text-sm md:text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-650'}`}>
                  <p>
                    I’m Jacob Crowe, an all-round photographer with a passion for capturing landscapes, automotive moments, and atmospheric scenes. Photography is a hobby and creative outlet for me, with much of my work shared across social media. Inspired by the landscapes and character of the Isle of Man, I aim to create images that capture a sense of place, mood, and atmosphere.
                  </p>
                  <p>
                    Under the brand <strong className="text-blue-600 dark:text-sky-400 font-extrabold">Manx Media</strong>, I create and share a range of photography and multimedia content across social media, including landscapes, automotive photography, locations, and behind-the-scenes moments. My content is focused on showcasing my work, experimenting with different styles, and sharing the places and subjects that inspire me.
                  </p>
                  <p>
                    This private portal gives me a simple way to manage, update, and organise my photography galleries. It allows me to keep my latest work available in one place, making it easy to showcase new captures without unnecessary technical complexity.
                  </p>
                </div>

                {/* TikTok & Social Callouts */}
                <div className="pt-6 border-t dark:border-slate-900 border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-4">
                    External Connections
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a 
                      href="https://www.tiktok.com/@officialmanxmedia" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-4 rounded-xl border group transition-all cursor-pointer ${darkMode ? 'border-slate-800 bg-slate-905 hover:bg-slate-900 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-500 hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-black text-xs">
                          T
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-505 font-semibold uppercase tracking-wider">TikTok</p>
                          <p className="text-sm font-bold tracking-wide uppercase">@officialmanxmedia</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </a>

                    <div className={`p-4 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-905' : 'border-slate-200 bg-slate-50'}`}>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">Origin Base</p>
                      <p className="text-sm font-black tracking-wide uppercase mt-1">Isle of Man, UK</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Available for cinematic projects & brand bookings.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 4: CONTACT RESERVATIONS */}
        {/* =============================================================== */}
        {activeTab === 'contact' && (
          <section id="section-contact" className="py-20 animate-fadeIn max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              
              {/* Contact introduction text */}
              <div className="text-center mb-16">
                <span className="text-blue-600 dark:text-sky-450 text-xs font-bold tracking-[0.4em] uppercase block mb-3">
                  Project Discussion
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase mb-4">
                  Initiate Booking
                </h2>
                <p className={`text-sm md:text-base leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                  Whether commission inquiries, automotive cinematography, licensing, or collaborations, dispatch your parameters below. Response is processed within 48 Hours.
                </p>
              </div>

              {/* Form implementation */}
              <div className={`border p-8 md:p-10 rounded-2xl ${darkMode ? 'bg-slate-900/40 border-slate-900 shadow-xl' : 'bg-white border-slate-200 shadow-2xl'}`} id="contact-form-container">
                
                {contactSuccess ? (
                   <div className="py-12 text-center animate-fadeIn" id="contact-success-block">
                    <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 font-black" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-wide uppercase mb-2">Message Dispatched</h3>
                    <p className={`text-sm tracking-wide max-w-md mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-655'}`}>
                      Thank you, Jacob. Your transmission has been securely saved. The administrator can audit and respond to your inquiry via the private logs dashboard.
                    </p>
                    <button 
                      onClick={() => setContactSuccess(false)}
                      className="mt-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors font-bold tracking-widest text-xs uppercase text-white dark:text-slate-950 py-3 px-8 rounded-lg outline-none cursor-pointer"
                    >
                      New Transmission
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Name input */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-400 mb-2">
                          Your Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-650 dark:group-focus-within:text-sky-400 transition-colors" />
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. John Doe"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className={`w-full py-3.5 pl-11 pr-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                          />
                        </div>
                      </div>

                      {/* Email input */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-400 mb-2">
                          Your Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-650 dark:group-focus-within:text-sky-400 transition-colors" />
                          <input 
                            type="email" 
                            required
                            placeholder="e.g. john@domain.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className={`w-full py-3.5 pl-11 pr-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Subject input */}
                    <div className="relative group">
                      <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-400 mb-2">
                        Subject
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Automotive Cinematography Booking"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className={`w-full py-3.5 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                      />
                    </div>

                    {/* Message input */}
                    <div className="relative group">
                      <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-400 mb-2">
                        Detailed Message *
                      </label>
                      <textarea 
                        required
                        rows={5}
                        placeholder="Please include project scope, timeline expectations, location configurations, and references..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className={`w-full py-3.5 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all resize-none ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingContact}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-slate-950 disabled:opacity-50 transition-all font-bold tracking-widest text-xs uppercase py-4.5 rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isSubmittingContact ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
                          <span>Dispatching Transmission...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <ArrowRight className="w-4 h-4 text-slate-950" />
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>
          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 5: ADMIN PORTAL Content Management Space */}
        {/* =============================================================== */}
        {activeTab === 'admin' && (
          <section id="section-admin" className="py-12 animate-fadeIn max-w-7xl mx-auto px-6">
            
            {/* If anonymous visitor, prompt pincode validation gate */}
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto py-12" id="admin-passcode-gate">
                <div className={`relative border p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-xl ${darkMode ? 'border-slate-900 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                  
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-550 flex items-center justify-center border border-blue-500/25 mb-6">
                    <Lock className="w-5 h-5 text-blue-500 dark:text-sky-400" />
                  </div>

                  <h3 className="text-xl font-extrabold tracking-wide uppercase mb-1">
                    CMS Secure Access
                  </h3>
                  <p className={`text-xs tracking-wide leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
                    Enter authorized credentials to manage portfolio contents.
                  </p>

                  <div className="w-full relative flex flex-col items-center">
                    {pinError && (
                      <div className="bg-rose-500/15 border border-rose-500/20 text-rose-500 text-[11px] font-semibold tracking-wide py-2.5 px-4 rounded-lg mb-6 w-full animate-fadeIn text-center leading-relaxed">
                        {pinError}
                      </div>
                    )}

                    <form onSubmit={handleEmailPasswordLogin} className="w-full flex flex-col gap-4">
                      <div className="text-left">
                        <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1.5">Authorized Username</label>
                        <input
                          type="text"
                          placeholder="ManxMediaAdmin"
                          value={adminUsernameInput}
                          onChange={(e) => setAdminUsernameInput(e.target.value)}
                          className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div className="text-left">
                        <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1.5 flex justify-between">
                          <span>Admin Password</span>
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg hover:shadow-blue-600/25 flex items-center justify-center gap-3 cursor-pointer"
                      >
                        {isAuthSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin animate-infinite" />
                            <span>Verifying Session...</span>
                          </>
                        ) : (
                          <span>Login Securely</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              
              /* Logged In Workspace */
              <div className="animate-fadeIn" id="cms-dashboard">
                
                {/* Dashboard Upper Metric bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b dark:border-slate-900 border-slate-200 pb-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-450 dark:from-blue-400 dark:to-sky-300 uppercase tracking-wide">
                      Manx Media CMS
                    </h2>
                    <p className={`text-xs mt-1 font-semibold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'} uppercase flex items-center gap-1.5`}>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      ADMIN SECURE SESSION FOR JACOB CROWE
                    </p>
                  </div>
                  <button 
                    onClick={handleAdminLogout}
                    className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold tracking-widest text-[11px] uppercase py-2.5 px-5 rounded-xl border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Terminate Session</span>
                  </button>
                </div>

                {isLocalFallbackMode && (
                  <div className="mb-8 p-5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-sky-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">CMS Local sandbox Mode Active</h4>
                        <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                          Your changes are being saved securely to your browser's persistent local storage. High-resolution photographs are securely hosted on Amazon S3.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid stats metric cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-230 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2 text-slate-505 font-bold uppercase tracking-wide text-blue-600 dark:text-sky-400">
                      <span className="text-[10px]">Total Photographs</span>
                      <Grid className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-3xl font-black">{photos.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Stored in sandbox database</p>
                  </div>

                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-230 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2 text-slate-505 font-bold uppercase tracking-wide text-blue-600 dark:text-sky-400">
                      <span className="text-[10px]">Active Custom Albums</span>
                      <Filter className="w-4 h-4 text-slate-550" />
                    </div>
                    <p className="text-3xl font-black">{categories.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Unique filter nodes setup</p>
                  </div>

                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-230 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2 text-slate-550 font-bold uppercase tracking-wide text-blue-600 dark:text-sky-400">
                      <span className="text-[10px]">Client Inquiries</span>
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black">{messages.length}</p>
                      {totalUnreadMessages > 0 && (
                        <span className="bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-black text-[9px] tracking-wider uppercase py-0.5 px-2 rounded-full">
                          {totalUnreadMessages} New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">Submissions logged via contact form</p>
                  </div>
                </div>

                {/* Dashboard Body layout: Sidebar + main subtab */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: CMS Sub-tab navigations */}
                  <div className="lg:col-span-3 flex flex-col space-y-2">
                    <button 
                      onClick={() => setAdminActiveSubTab('upload')}
                      className={`text-left p-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer ${adminActiveSubTab === 'upload' ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-lg shadow-blue-500/15' : darkMode ? 'bg-slate-900/40 text-slate-350 hover:bg-slate-900' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </div>
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => setAdminActiveSubTab('photos')}
                      className={`text-left p-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer ${adminActiveSubTab === 'photos' ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-lg shadow-blue-500/15' : darkMode ? 'bg-slate-900/40 text-slate-350 hover:bg-slate-900' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Grid className="w-4 h-4" />
                        <span>Manage Grid</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-900 dark:text-slate-400 bg-slate-100 text-slate-600 font-bold">{photos.length}</span>
                    </button>

                    <button 
                      onClick={() => setAdminActiveSubTab('categories')}
                      className={`text-left p-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer ${adminActiveSubTab === 'categories' ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-lg shadow-blue-500/15' : darkMode ? 'bg-slate-900/40 text-slate-350 hover:bg-slate-900' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Filter className="w-4 h-4" />
                        <span>Manage Category</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-900 dark:text-slate-400 bg-slate-100 text-slate-600 font-bold">{categories.length}</span>
                    </button>

                    <button 
                      onClick={() => setAdminActiveSubTab('messages')}
                      className={`text-left p-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer ${adminActiveSubTab === 'messages' ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-lg shadow-blue-500/15' : darkMode ? 'bg-slate-900/40 text-slate-355 hover:bg-slate-900' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>Inquiries Box</span>
                      </div>
                      {totalUnreadMessages > 0 ? (
                        <span className="bg-rose-500 text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
                          {totalUnreadMessages}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-900 bg-slate-100 text-slate-500 font-bold">{messages.length}</span>
                      )}
                    </button>

                    <button 
                      onClick={() => setAdminActiveSubTab('settings')}
                      className={`text-left p-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer ${adminActiveSubTab === 'settings' ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-slate-950 font-black shadow-lg shadow-blue-500/15' : darkMode ? 'bg-slate-900/40 text-slate-350 hover:bg-slate-900' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4" />
                        <span>Security & PIN</span>
                      </div>
                    </button>
                  </div>

                  {/* Right Column: CMS Active tab Details panel */}
                  <div className="lg:col-span-9">

                    {/* SUB-SUBTAB A: PHOTO UPLOADS & WATERMARK DESIGNER */}
                    {adminActiveSubTab === 'upload' && (
                      <div className="space-y-6 animate-fadeIn">
                        
                        {/* Interactive Tab Switcher */}
                        <div className={`p-2 rounded-xl border flex flex-col sm:flex-row gap-2 ${darkMode ? 'bg-slate-900/60 border-slate-900/80' : 'bg-slate-100 border-slate-200'}`}>
                          <button
                            type="button"
                            onClick={() => setUploadMode('single')}
                            className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${uploadMode === 'single' ? darkMode ? 'bg-blue-600 text-white font-black shadow' : 'bg-white border text-blue-700 font-black shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Single Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadMode('dump')}
                            className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${uploadMode === 'dump' ? darkMode ? 'bg-blue-600 text-white font-black shadow' : 'bg-white border text-blue-700 font-black shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Photo Dump (Batch)
                          </button>
                        </div>

                        {uploadSuccess && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 p-4 rounded-xl text-xs font-semibold tracking-wide uppercase flex items-center gap-2 mb-4">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>Portfolio database synchronized successfully!</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative">
                          <div className="xl:col-span-6 space-y-6">

                            {/* MODE A: SINGLE PHOTO UPLOAD */}
                            {uploadMode === 'single' && (
                              <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="flex items-center gap-2.5 mb-6">
                                  <Upload className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                                  <h4 className="text-lg font-bold uppercase tracking-wide text-slate-800 dark:text-white">Publish Single Frame</h4>
                            </div>

                            <form onSubmit={handlePhotoUpload} className="space-y-6">
                              {/* File Drag Zone */}
                              <div>
                                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2">
                                  Select Photo File *
                                </label>
                                
                                {uploadPreview ? (
                                  <div className="relative aspect-video max-h-96 rounded-xl overflow-hidden border dark:border-slate-800 border-slate-200 bg-slate-900/10 flex items-center justify-center">
                                    <img 
                                      src={uploadPreview} 
                                      alt="Upload review preview" 
                                      className="h-full w-full object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedFile(null); setUploadPreview(null); setBatchFiles([]); setBatchPreviews([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                      className="absolute top-4 right-4 bg-rose-500 hover:bg-rose-600 cursor-pointer p-2 rounded-full text-white shadow-xl focus:outline-none transition-colors"
                                      title="Remove image"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur py-1.5 px-3.5 rounded text-[10px] font-mono font-bold text-slate-300 pointer-events-none select-none">
                                      {selectedFile ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Blob Reference Loaded'}
                                    </div>
                                    {watermarkEnabled && (
                                      <div className="absolute bottom-4 right-4 bg-blue-500/95 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded tracking-wider uppercase">
                                        Watermark Imprint Active
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`aspect-video max-h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-500/5 animate-pulse' : darkMode ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/20' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50'}`}
                                  >
                                    <Upload className={`w-10 h-10 mb-4 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <h5 className="font-extrabold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-300">Drag & Drop Image Here</h5>
                                    <p className="text-2xs text-slate-500 uppercase tracking-widest mt-1">Or click to search folders (.jpg, .png, .webp, .jpeg)</p>
                                    <input 
                                      ref={fileInputRef}
                                      type="file" 
                                      accept="image/*"
                                      onChange={handleFileChange}
                                      className="hidden" 
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Title and Category */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="relative group">
                                  <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2">
                                    Photo Frame Title *
                                  </label>
                                  <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Shadowed Range Rover"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                                  />
                                </div>

                                <div className="relative group">
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450">
                                      Category / Album *
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                                      className="text-[9px] font-black text-blue-600 dark:text-sky-405 uppercase tracking-widest hover:text-blue-750 dark:hover:text-sky-300 transition-colors"
                                    >
                                      {showNewCatInput ? "Select Existing" : "+ Create New Album"}
                                    </button>
                                  </div>

                                  {showNewCatInput ? (
                                    <input 
                                      type="text"
                                      placeholder="e.g. Coastal Landscapes"
                                      required
                                      value={uploadForm.newCategoryName}
                                      onChange={(e) => setUploadForm({ ...uploadForm, newCategoryName: e.target.value })}
                                      className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                                    />
                                  ) : (
                                    <select
                                      value={uploadForm.category}
                                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                      className={`w-full py-3 px-5 text-sm rounded-xl font-semibold border bg-transparent focus:outline-none focus:ring-1 border-slate-850 focus:border-blue-500 dark:focus:border-sky-400 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'}`}
                                    >
                                      {categories.map((c) => (
                                        <option key={c.id} value={c.name} className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-955'}`}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              <div className="relative group">
                                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2">
                                  Photo Description
                                </label>
                                <textarea 
                                  rows={3}
                                  placeholder="Describe the mood, environment context, filter depth, lenses used (e.g., 50mm f/1.2)..."
                                  value={uploadForm.description}
                                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                  className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all resize-none ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-sky-400' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-blue-500'}`}
                                />
                              </div>

                              {/* Camera EXIF Metadata (Optional) */}
                              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <h6 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                                  <span>📷 Camera & Capture EXIF Metadata (Optional)</span>
                                </h6>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">Camera Body</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Sony A7R V"
                                      value={uploadForm.camera}
                                      onChange={(e) => setUploadForm({ ...uploadForm, camera: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-405'}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">Lens</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. 24-70mm f/2.8"
                                      value={uploadForm.lens}
                                      onChange={(e) => setUploadForm({ ...uploadForm, lens: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-405'}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">ISO</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. 100"
                                      value={uploadForm.iso}
                                      onChange={(e) => setUploadForm({ ...uploadForm, iso: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-405'}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">Shutter Speed</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. 1/125s"
                                      value={uploadForm.shutterSpeed}
                                      onChange={(e) => setUploadForm({ ...uploadForm, shutterSpeed: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-405'}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">Aperture</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. f/8"
                                      value={uploadForm.aperture}
                                      onChange={(e) => setUploadForm({ ...uploadForm, aperture: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-405'}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1.5">Focal Length</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. 24mm"
                                      value={uploadForm.focalLength}
                                      onChange={(e) => setUploadForm({ ...uploadForm, focalLength: e.target.value })}
                                      className={`w-full py-2 px-3.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-450'}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Featured & Published checks */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-4 border-b border-t dark:border-slate-850/80 border-slate-100/80 my-2">
                                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold select-none flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={uploadForm.isFeatured}
                                    onChange={(e) => setUploadForm({ ...uploadForm, isFeatured: e.target.checked })}
                                    className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 focus:ring-0 cursor-pointer accent-blue-600"
                                  />
                                  <div className="flex flex-col text-left">
                                    <span className="uppercase tracking-wide text-xs">Mark as Featured Image</span>
                                    <span className="text-[10px] text-slate-500">Will be featured on the Home Page curated slider</span>
                                  </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold select-none flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={uploadForm.isPublished}
                                    onChange={(e) => setUploadForm({ ...uploadForm, isPublished: e.target.checked })}
                                    className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 focus:ring-0 cursor-pointer accent-blue-600"
                                  />
                                  <div className="flex flex-col text-left">
                                    <span className="uppercase tracking-wide text-xs">Publish Immediately</span>
                                    <span className="text-[10px] text-slate-500">Enable to go live immediately, disable for Draft</span>
                                  </div>
                                </label>
                              </div>

                              {/* Performance optimization details warning */}
                              <div className={`p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                                <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="text-left">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">Automatic Client Optimization</p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                    Manx Media automatically reduces excessive file widths to maximum 1200px and matches standard Jpeg compressions inside your browser. This keeps uploads smooth, and ensures optimized rendering speeds.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={isUploading || !uploadPreview}
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-40 select-none text-white dark:text-slate-950 font-black tracking-widest text-xs uppercase py-4 rounded-xl flex items-center justify-center gap-2.5 shadow-lg active:scale-99 transition-all cursor-pointer"
                              >
                                {isUploading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-slate-955" />
                                    <span>Encoding & Publishing Photo...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    <span>Add Photo Frame to Portfolio</span>
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        )}

                        {/* MODE B: PHOTO DUMP (BATCH LOADER) */}
                        {uploadMode === 'dump' && (
                          <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2.5">
                                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-sky-455" />
                                <h4 className="text-lg font-bold uppercase tracking-wide text-slate-805 dark:text-white-pure">Portfolio Photo Dump</h4>
                              </div>
                              <span className="text-[10px] font-bold tracking-widest uppercase py-1 px-3.5 rounded-full bg-blue-500/10 text-blue-500">
                                {batchFiles.length} Queue Items
                              </span>
                            </div>

                            <form onSubmit={handleBatchPhotoUpload} className="space-y-6">
                              {/* Bulk File Selection Zone */}
                              <div>
                                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2 font-black text-left">
                                  Drag Multiple Photo Assets *
                                </label>

                                <div
                                  onDragEnter={handleDrag}
                                  onDragOver={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDrop={handleDrop}
                                  onClick={() => {
                                    if (batchFileInputRef.current) {
                                      batchFileInputRef.current.click();
                                    }
                                  }}
                                  className={`aspect-video max-h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-500/5' : darkMode ? 'border-slate-800 bg-slate-950/40 hover:border-slate-705' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
                                >
                                  <Folder className="w-10 h-10 mb-3 text-blue-550 dark:text-sky-455" />
                                  <h5 className="font-extrabold text-sm uppercase tracking-wide text-slate-705 dark:text-slate-300">Drop Multi-Files / Folder Contents</h5>
                                  <p className="text-2xs text-slate-500 uppercase tracking-widest mt-1">Accepts multiple .jpg, .png, .webp image selections</p>
                                  <input 
                                    ref={batchFileInputRef}
                                    type="file" 
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden" 
                                  />
                                </div>

                                {/* Active Queue Photo Chips */}
                                {batchPreviews.length > 0 && (
                                  <div className="mt-4 p-4 rounded-xl border dark:border-slate-850 border-slate-205 bg-slate-950/20 max-h-60 overflow-y-auto space-y-2 text-left">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                      <span>Queue Batch Preview</span>
                                      <button 
                                        type="button" 
                                        onClick={() => { setBatchFiles([]); setBatchPreviews([]); if (batchFileInputRef.current) batchFileInputRef.current.value = ''; }}
                                        className="text-rose-500 hover:text-rose-455 text-[9px] font-black tracking-widest uppercase cursor-pointer"
                                      >
                                        Clear All
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                      {batchPreviews.map((src, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border dark:border-slate-800 border-slate-300 bg-slate-900 group">
                                          <img 
                                            src={src} 
                                            alt="Queue item preview" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setBatchFiles(prev => prev.filter((_, idx) => idx !== index));
                                              setBatchPreviews(prev => prev.filter((_, idx) => idx !== index));
                                            }}
                                            className="absolute top-1 right-1 bg-rose-500/90 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                                            title="Prune photograph"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                          <div className="absolute bottom-0 text-[8px] font-mono p-1 bg-slate-955/85 text-slate-300 truncate w-full">
                                            {batchFiles[index]?.name || 'Photo unit'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Titles strategies */}
                              <div className="p-4.5 rounded-xl border dark:border-slate-850 border-slate-210 space-y-4">
                                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2 block text-left">
                                  Generate Album Titles Using
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setDumpTitleStrategy('filename')}
                                    className={`py-3.5 px-4 text-xs font-bold uppercase rounded-lg border text-center transition-all cursor-pointer ${dumpTitleStrategy === 'filename' ? 'border-blue-600 bg-blue-500/5 text-blue-500' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                  >
                                    📁 Derive from File Names
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDumpTitleStrategy('prefix')}
                                    className={`py-3.5 px-4 text-xs font-bold uppercase rounded-lg border text-center transition-all cursor-pointer ${dumpTitleStrategy === 'prefix' ? 'border-blue-600 bg-blue-500/5 text-blue-500' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                  >
                                    🔢 Numbered Series Pattern
                                  </button>
                                </div>

                                {dumpTitleStrategy === 'prefix' && (
                                  <div className="animate-fadeIn relative text-left">
                                    <label className="text-[9px] font-bold tracking-widest uppercase block text-slate-500 mb-1.5">
                                      Series Prefix (e.g. "Rally")
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Yields Rally #1, Rally #2..."
                                      required={dumpTitleStrategy === 'prefix'}
                                      value={dumpTitlePrefix}
                                      onChange={(e) => setDumpTitlePrefix(e.target.value)}
                                      className={`w-full py-2.5 px-4 text-xs rounded-lg font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkMode ? 'border-slate-800 text-white focus:border-sky-400' : 'border-slate-205 text-slate-900 focus:border-blue-550'}`}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Target Category Folder Selector */}
                              <div className="relative group text-left">
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-455">
                                    Target Category Folder / Album *
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                                    className="text-[9px] font-black text-blue-600 dark:text-sky-405 uppercase tracking-widest hover:text-blue-755 dark:hover:text-sky-305 transition-colors"
                                  >
                                    {showNewCatInput ? "Select Existing" : "+ Create New Folder"}
                                  </button>
                                </div>

                                {showNewCatInput ? (
                                  <input 
                                    type="text"
                                    placeholder="e.g. Isle of Man Rally"
                                    required
                                    value={uploadForm.newCategoryName}
                                    onChange={(e) => setUploadForm({ ...uploadForm, newCategoryName: e.target.value })}
                                    className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-205 text-slate-950 placeholder-slate-400'}`}
                                  />
                                ) : (
                                  <select
                                    value={uploadForm.category}
                                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                    className={`w-full py-3 px-5 text-sm rounded-xl font-semibold border bg-transparent focus:outline-none focus:ring-1 border-slate-850 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-202 text-slate-950'}`}
                                  >
                                    {categories.map((c) => (
                                      <option key={c.id} value={c.name} className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-950'}`}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Shared Description */}
                              <div className="relative group text-left">
                                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-2">
                                  Default Description (Applies to all files in dump)
                                  <span className="text-[9px] lowercase font-normal ml-1"> - optional</span>
                                </label>
                                <textarea 
                                  rows={2}
                                  placeholder="e.g. Isle Of Man atmospheric frame collection captured during May tests..."
                                  value={dumpDescription}
                                  onChange={(e) => setDumpDescription(e.target.value)}
                                  className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-sky-400 resize-none transition-all ${darkMode ? 'border-slate-800 text-white focus:border-sky-400' : 'border-slate-205 text-slate-955 focus:border-blue-500'}`}
                                />
                              </div>

                              {/* Options */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-4 border-b border-t dark:border-slate-850/80 border-slate-100/80 my-2">
                                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={dumpIsFeatured}
                                    onChange={(e) => setDumpIsFeatured(e.target.checked)}
                                    className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 accent-blue-600 cursor-pointer focus:ring-0"
                                  />
                                  <div className="flex flex-col text-left">
                                    <span className="uppercase tracking-wide text-xs font-semibold">Mark All as Featured Images</span>
                                    <span className="text-[10px] text-slate-500">Will scatter them onto the homepage featured sliders</span>
                                  </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={dumpIsPublished}
                                    onChange={(e) => setDumpIsPublished(e.target.checked)}
                                    className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 accent-blue-600 cursor-pointer focus:ring-0"
                                  />
                                  <div className="flex flex-col text-left">
                                    <span className="uppercase tracking-wide text-xs font-semibold">Publish All Immediately</span>
                                    <span className="text-[10px] text-slate-500">Disable to upload the entire batch as Draft</span>
                                  </div>
                                </label>
                              </div>

                              {/* Multi uploader Progress UI */}
                              {uploadProgress && (
                                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-550 rounded-xl p-4.5 space-y-2 mt-4 text-xs font-semibold text-left">
                                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                    <span>{uploadProgress.stage}</span>
                                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                                  </div>
                                  <div className="w-full bg-slate-800 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300"
                                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isUploading || batchFiles.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-40 select-none text-white dark:text-slate-950 font-black tracking-widest text-xs uppercase py-4 rounded-xl flex items-center justify-center gap-2.5 shadow-lg active:scale-99 transition-all cursor-pointer"
                              >
                                {isUploading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-slate-955" />
                                    <span>Processing photo dump stream...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    <span>Execute Photo Dump ({batchFiles.length} Photographs)</span>
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        )}
                        </div>

                        {/* WATERMARK CONFIGURATION DESIGNER (Right - Colspan 6) */}
                        <div className="xl:col-span-6 space-y-8 sticky top-6">
                            
                            {/* Watermark Widgets panel */}
                            <div className={`p-6 md:p-8 rounded-2xl border space-y-6 ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-205 shadow-sm'}`}>
                              <div className="flex items-center gap-2.5 border-b dark:border-slate-850 border-slate-200 pb-4">
                                <Settings className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                                <h4 className="text-lg font-bold uppercase tracking-wide text-slate-800 dark:text-white">Automatic Watermark Brand</h4>
                              </div>

                              <div className="flex items-center justify-between p-4.5 rounded-xl border dark:border-slate-850 border-slate-200 bg-slate-950/20">
                                <div className="text-left">
                                  <h5 className="text-xs uppercase font-bold tracking-wider">Enable Watermark overlays</h5>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Applied on-the-fly during upload processing</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={watermarkEnabled}
                                    onChange={(e) => {
                                      setWatermarkEnabled(e.target.checked);
                                      localStorage.setItem('manx_wm_enabled', String(e.target.checked));
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-650 peer-checked:bg-blue-600"></div>
                                </label>
                              </div>

                              {watermarkEnabled && (
                                <div className="space-y-6 animate-fadeIn">
                                  {/* Watermark Brand textual label */}
                                  <div className="relative">
                                    <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-455 mb-2">
                                      Brand Watermark Text
                                    </label>
                                    <input 
                                      type="text"
                                      placeholder="e.g. MANX MEDIA"
                                      value={watermarkConfig.text}
                                      onChange={(e) => {
                                        const newConf = { ...watermarkConfig, text: e.target.value };
                                        setWatermarkConfig(newConf);
                                        localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                      }}
                                      className={`w-full py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}
                                    />
                                  </div>

                                  {/* Logo Emblem style selection */}
                                  <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-455 mb-2.5">
                                      Watermark Vector Emblem style
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      {[
                                        { key: 'text-only', label: 'Elegant Text Only' },
                                        { key: 'custom-image', label: 'Custom Brand File' }
                                      ].map((item) => (
                                        <button
                                          key={item.key}
                                          type="button"
                                          onClick={() => {
                                            const newConf = { ...watermarkConfig, logoStyle: item.key };
                                            setWatermarkConfig(newConf);
                                            localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                          }}
                                          className={`py-3 px-4 rounded-lg border text-2xs uppercase tracking-wider font-extrabold transition-all text-center cursor-pointer ${watermarkConfig.logoStyle === item.key ? 'border-blue-600 bg-blue-500/5 text-blue-500 font-black' : 'border-slate-805 text-slate-400 hover:border-slate-700'}`}
                                        >
                                          {item.label}
                                        </button>
                                      ))}
                                    </div>

                                    {watermarkConfig.logoStyle === 'custom-image' && (
                                      <div className="p-4 border border-dashed dark:border-slate-700 border-slate-300 rounded-xl">
                                        <label className="block text-[9px] uppercase tracking-widest font-bold mb-2">Upload Custom PNG/JPG Logo</label>
                                        <input 
                                          type="file" 
                                          accept="image/*"
                                          className="text-xs w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20 cursor-pointer"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                const newConf = { ...watermarkConfig, customLogoBase64: reader.result as string };
                                                setWatermarkConfig(newConf);
                                                localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Quad placement grids */}
                                  <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-455 mb-2.5">
                                      Canvas Placement Corner
                                    </label>
                                    <div className="grid grid-cols-3 gap-2.5 max-w-sm">
                                      {[
                                        { key: 'top-left', label: 'Top Left' },
                                        { key: 'top-right', label: 'Top Right' },
                                        { key: 'bottom-left', label: 'Bottom Left' },
                                        { key: 'bottom-right', label: 'Bottom Right' },
                                        { key: 'center', label: 'Center Glow' }
                                      ].map((item) => (
                                        <button
                                          key={item.key}
                                          type="button"
                                          onClick={() => {
                                            const newConf = { ...watermarkConfig, position: item.key };
                                            setWatermarkConfig(newConf);
                                            localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                          }}
                                          className={`py-2 px-3 rounded-md border text-[9px] font-bold tracking-widest uppercase text-center transition-all cursor-pointer ${watermarkConfig.position === item.key ? 'border-blue-600 bg-blue-500/10 text-blue-500' : 'border-slate-850 text-slate-500 hover:border-slate-805'}`}
                                        >
                                          {item.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Sizing & Shade parameters */}
                                  <div className="space-y-4 text-left">
                                    <div>
                                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                                        <span>Transparency Opacity ({Math.round(watermarkConfig.opacity * 100)}%)</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0.1" 
                                        max="1.0"
                                        step="0.05"
                                        value={watermarkConfig.opacity}
                                        onChange={(e) => {
                                          const newConf = { ...watermarkConfig, opacity: parseFloat(e.target.value) };
                                          setWatermarkConfig(newConf);
                                          localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                        }}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                                        <span>Proportional Canvas Scale ({Math.round(watermarkConfig.scale * 100)}%)</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0.08" 
                                        max="0.30"
                                        step="0.01"
                                        value={watermarkConfig.scale}
                                        onChange={(e) => {
                                          const newConf = { ...watermarkConfig, scale: parseFloat(e.target.value) };
                                          setWatermarkConfig(newConf);
                                          localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                        }}
                                        className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-455 mb-2 text-left">
                                        Brand Ink Color Tone
                                      </label>
                                      <div className="flex gap-4">
                                        {[
                                          { color: '#ffffff', label: 'Pure Frost White' },
                                          { color: '#111827', label: 'Midnight Obsidian Black' }
                                        ].map((item) => (
                                          <button
                                            key={item.color}
                                            type="button"
                                            onClick={() => {
                                              const newConf = { ...watermarkConfig, color: item.color };
                                              setWatermarkConfig(newConf);
                                              localStorage.setItem('manx_wm_config', JSON.stringify(newConf));
                                            }}
                                            className={`py-2 px-4 rounded-lg text-2xs uppercase tracking-wider font-extrabold flex items-center gap-2 cursor-pointer transition-all border ${watermarkConfig.color === item.color ? 'border-blue-600 bg-blue-500/5 text-blue-500' : 'border-slate-800 text-slate-455 hover:border-slate-705'}`}
                                          >
                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: item.color }} />
                                            <span>{item.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Camera Viewfinder Preview Panel (Right - Colspan 6) */}
                            <div className="lg:col-span-6 flex flex-col justify-center">
                              <span className="text-[10px] font-bold tracking-widest uppercase block text-slate-400 mb-2.5 text-center lg:text-left">
                                Real-Time Viewfinder Overlay Preview
                              </span>

                              {/* Physical Viewfinder Mock */}
                              <div className="relative aspect-video rounded-2xl overflow-hidden border dark:border-slate-800 border-slate-200 bg-slate-950 flex shadow-2xl select-none" id="viewfinder-mock-frame">
                                
                                {/* Background Image: Moody retro car in fog representation fallback */}
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center grayscale shadow-inner saturate-75 opacity-90 pointer-events-none" />

                                {/* Viewfinder UI borders and Telemetry markings: NO Simulated Ports, only humbles Camera Focus telemetry */}
                                <div className="absolute inset-4 border border-white/10 pointer-events-none flex flex-col justify-between p-4">
                                  {/* Corners reticles */}
                                  <div className="flex justify-between text-white/40 font-mono text-[9px]">
                                    <span>[REC LIVE]</span>
                                    <span>30 FPS</span>
                                  </div>

                                  {/* Center Camera Grid Circle and Focus crosshair */}
                                  <div className="absolute inset-0 m-auto w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                  </div>

                                  <div className="flex justify-between text-white/40 font-mono text-[9px]">
                                    <span>ISO 400</span>
                                    <span>F/2.8</span>
                                  </div>
                                </div>

                                {/* Simulated Overlay representing the Live Watermark parameters */}
                                {watermarkEnabled && (
                                  <div 
                                    className="absolute transition-all duration-300 pointer-events-none flex flex-col items-center justify-center font-sans"
                                    style={{
                                      // Placements quadrants mapping 
                                      top: watermarkConfig.position.startsWith('top') ? '12%' : watermarkConfig.position === 'center' ? '40%' : 'auto',
                                      bottom: watermarkConfig.position.startsWith('bottom') ? '12%' : 'auto',
                                      left: watermarkConfig.position.endsWith('left') ? '12%' : watermarkConfig.position === 'center' ? '40%' : 'auto',
                                      right: watermarkConfig.position.endsWith('right') ? '12%' : 'auto',
                                      transform: watermarkConfig.position === 'center' ? 'translate(-10%, -10%)' : 'none',
                                      opacity: watermarkConfig.opacity,
                                      // Proportional size representation of scale
                                      width: `${watermarkConfig.scale * 100}%`,
                                      color: watermarkConfig.color
                                    }}
                                  >
                                    <div className="text-center w-full flex flex-col items-center">
                                      
                                      {/* Secondary dynamic visual text label */}
                                      {watermarkConfig.logoStyle !== 'custom-image' && (
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] select-none block truncate w-full" style={{ color: watermarkConfig.color }}>
                                          {watermarkConfig.logoStyle === 'text-only' ? `© ${watermarkConfig.text}` : watermarkConfig.text}
                                        </span>
                                      )}

                                      {/* Custom Image preview layout */}
                                      {watermarkConfig.logoStyle === 'custom-image' && (
                                        <div className="flex items-center justify-center opacity-90 transition-all">
                                          {watermarkConfig.customLogoBase64 ? (
                                            <img src={watermarkConfig.customLogoBase64} alt="Custom watermark" className="max-w-[4rem] max-h-[4rem] object-contain" />
                                          ) : (
                                            <div className="text-[8px] uppercase tracking-widest bg-slate-800 text-slate-400 p-2 rounded-lg font-bold border border-slate-700">Preview Logo Here</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <p className="text-2xs text-slate-500 uppercase tracking-widest mt-3.5 text-center">
                                Tip: Start uploading in the panel to the left, this watermark will be applied automatically.
                              </p>
                            </div>

                          </div>
                        </div>

                      </div>
                    )}

                    {/* SUB-SUBTAB B: PHOTO GRID MANAGE */}
                    {adminActiveSubTab === 'photos' && (
                      <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-6 border-b dark:border-slate-850 border-slate-200 pb-4">
                          <div className="flex items-center gap-2.5">
                            <Grid className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                            <h4 className="text-lg font-bold uppercase tracking-wide">Manage Active Portfolio</h4>
                          </div>
                          <span className={`text-[10px] font-bold tracking-widest uppercase py-1 px-3.5 rounded-full ${darkMode ? 'bg-slate-900 text-slate-450' : 'bg-slate-100 text-slate-600'}`}>
                            {photos.length} Captured Blocks
                          </span>
                        </div>

                        {photos.length === 0 ? (
                          <div className="text-center py-16">
                            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
                            <h5 className="font-extrabold uppercase tracking-wide mb-1">Grid is Clear</h5>
                            <p className="text-xs text-slate-500">Every piece has been scrubbed. Access the Upload panel to seed new frames.</p>
                          </div>
                        ) : (
                          <div className="space-y-4" id="admin-photo-crud-list">
                            {photos.map((item, idx) => (
                              <div 
                                key={item.id}
                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-4 ${darkMode ? 'bg-slate-950/50 border-slate-900 hover:border-slate-800' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                              >
                                <div className="flex items-center gap-4 w-full">
                                  <div className="flex flex-col space-y-1">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => handleReorderPhoto(idx, 'up')}
                                      className="text-slate-500 hover:text-blue-500 disabled:opacity-20"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      disabled={idx === photos.length - 1}
                                      onClick={() => handleReorderPhoto(idx, 'down')}
                                      className="text-slate-500 hover:text-blue-500 disabled:opacity-20"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-16 h-16 object-cover rounded-lg border dark:border-slate-800 border-slate-205"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-extrabold text-sm uppercase tracking-wide truncate">{item.title}</h5>
                                      {item.isFeatured && (
                                        <span className="bg-blue-500/10 text-blue-600 dark:text-sky-450 border border-blue-500/20 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">
                                          Featured
                                        </span>
                                      )}
                                      <span className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border ${
                                        item.isPublished 
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      }`}>
                                        {item.isPublished ? 'Published' : 'Draft'}
                                      </span>
                                    </div>
                                    <p className="text-2xs text-blue-600 dark:text-sky-400 font-bold uppercase tracking-widest mt-1">Album: {item.category}</p>
                                    <p className={`text-2xs ${darkMode ? 'text-slate-500' : 'text-slate-400'} truncate mt-0.5`}>{item.description}</p>
                                  </div>
                                                         <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => startEditPhoto(item)}
                                    className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    title="Edit details & replace image"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublished(item)}
                                    className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${item.isPublished ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-transparent' : darkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-900' : 'border-emerald-500/10 text-emerald-600 hover:bg-emerald-100'}`}
                                    title={item.isPublished ? "Unpublish to draft" : "Publish to gallery"}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleFeatured(item)}
                                    className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${item.isFeatured ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-sky-400 hover:bg-transparent hover:border-slate-850' : darkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    title={item.isFeatured ? "Revoke curation highlight" : "Mark as curated highlight fontpage"}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(item.id)}
                                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                    title="Erase photograph"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-SUBTAB C: MANAGE CATEGORIES */}
                    {adminActiveSubTab === 'categories' && (
                      <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2.5 mb-6">
                          <Filter className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                          <h4 className="text-lg font-bold uppercase tracking-wide">Manage Category Albums</h4>
                        </div>

                        {/* Custom addition form inline */}
                        <form onSubmit={handleCreateCategoryAdmin} className="flex gap-4 mb-8">
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Fine Art Studio"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className={`flex-1 py-3 px-5 text-sm rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-550 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600 focus:border-amber-500' : 'border-slate-200 text-slate-950 placeholder-slate-400 focus:border-amber-500'}`}
                          />
                          <button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black tracking-widest text-xs uppercase py-3.5 px-6 rounded-xl flex items-center gap-2.5 cursor-pointer active:scale-97 select-none transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Album</span>
                          </button>
                        </form>

                        {/* Active category list detail */}
                        <div className="space-y-3" id="admin-category-list">
                          {categories.map((cat) => {
                            const photosInCat = photos.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                            return (
                              <div 
                                key={cat.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 ${darkMode ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'}`}
                              >
                                {editingCatId === cat.id ? (
                                  <div className="flex items-center gap-3 w-full">
                                    <input 
                                      type="text"
                                      value={editCatName}
                                      onChange={(e) => setEditCatName(e.target.value)}
                                      className={`flex-1 py-1.5 px-3.5 text-xs rounded-lg font-bold uppercase border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? 'border-slate-800 text-white focus:border-blue-500' : 'border-slate-300 text-slate-950 focus:border-blue-500'}`}
                                      required
                                      autoFocus
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => handleRenameCategoryAdmin(cat.id, cat.name, editCatName)}
                                      className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-600 font-bold active:scale-97 text-slate-950 text-[10px] tracking-widest uppercase rounded-lg cursor-pointer transition-all"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setEditingCatId(null)}
                                      className="py-2 px-3.5 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 font-bold active:scale-97 text-[10px] tracking-widest uppercase rounded-lg cursor-pointer transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <h5 className="font-extrabold text-sm uppercase tracking-wide">{cat.name}</h5>
                                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{photosInCat} Active Photographs</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}
                                        className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-550/20 cursor-pointer flex text-[10px] items-center font-bold gap-1 transition-all"
                                        title={`Rename album ${cat.name}`}
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                        <span className="uppercase tracking-widest text-[8px] font-black">Rename</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCategoryAdmin(cat.id, cat.name)}
                                        className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/25 cursor-pointer flex transition-all"
                                        title={`Remove album ${cat.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SUB-SUBTAB D: INQUIRIES BOX CRM */}
                    {adminActiveSubTab === 'messages' && (
                      <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-6 border-b dark:border-slate-850 border-slate-200 pb-4">
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-5 h-5 text-amber-500" />
                            <h4 className="text-lg font-bold uppercase tracking-wide">Client Inquiries Box</h4>
                          </div>
                          {totalUnreadMessages > 0 && (
                            <span className="bg-rose-500 text-white font-black text-[10px] tracking-widest uppercase py-1 px-3.5 rounded-full">
                              {totalUnreadMessages} Pending
                            </span>
                          )}
                        </div>

                        {messages.length === 0 ? (
                          <div className="text-center py-16">
                            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
                            <h5 className="font-extrabold uppercase tracking-wide mb-1">Inbox is Empty</h5>
                            <p className="text-xs text-slate-505">No submissions logged. Any user entries in the Contact form appear here immediately.</p>
                          </div>
                        ) : (
                          <div className="space-y-4" id="crm-messages-list">
                            {messages.map((item) => (
                              <div 
                                key={item.id}
                                className={`border p-6 rounded-2xl text-left transition-all ${
                                  !item.isRead 
                                    ? darkMode 
                                      ? 'border-blue-500/30 bg-blue-500/5' 
                                      : 'border-blue-300 bg-blue-50/20' 
                                    : darkMode 
                                      ? 'border-slate-900 bg-slate-950/60' 
                                      : 'border-slate-200 bg-slate-100/50'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-black text-sm uppercase tracking-wide">{item.name}</h5>
                                      {!item.isRead && (
                                        <span className="bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950 text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded">
                                          Unread Inquiry
                                        </span>
                                      )}
                                    </div>
                                    <a 
                                      href={`mailto:${item.email}`} 
                                      className="text-xs text-blue-600 dark:text-sky-450 hover:text-blue-700 dark:hover:text-sky-300 hover:underline font-semibold block mt-0.5"
                                    >
                                      {item.email}
                                    </a>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(item.createdAt).toLocaleString()}</p>
                                </div>

                                <div className="mb-4">
                                  <p className="text-[11px] text-blue-600 dark:text-sky-400 font-bold uppercase tracking-widest font-sans">Subject: {item.subject}</p>
                                  <p className={`text-sm mt-1.5 leading-relaxed font-serif ${darkMode ? 'text-slate-300' : 'text-slate-700'} whitespace-pre-wrap`}>
                                    "{item.message}"
                                  </p>
                                </div>

                                <div className="flex items-center justify-between border-t dark:border-slate-900 border-slate-200 pt-4 mt-2">
                                  <button
                                    onClick={() => handleMarkMessageRead(item.id)}
                                    disabled={item.isRead}
                                    className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all outline-none ${item.isRead ? 'text-slate-500' : 'text-emerald-500 hover:text-emerald-400 cursor-pointer'}`}
                                  >
                                    <Check className="w-3.5 h-3.5 font-bold" />
                                    <span>{item.isRead ? 'Inquiry Reviewed' : 'Mark as Reviewed'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteMessage(item.id)}
                                    className="text-rose-500 hover:text-rose-450 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 cursor-pointer outline-none"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Inquiries</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-SUBTAB E: SETTINGS & BACKUP DELEGATION */}
                    {adminActiveSubTab === 'settings' && (
                      <div className="space-y-6">
                        {/* CMS Administration Security state */}
                        <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-2.5 mb-4 text-emerald-600">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            <h4 className="text-lg font-bold uppercase tracking-wide">CMS Administrative Credentials</h4>
                          </div>
                          
                          <p className={`text-xs max-w-2xl leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Your admin dashboard session is protected by a secure credentials verification endpoint. Public registration is disabled; access is strictly locked down to defined environment secrets.
                          </p>

                          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${darkMode ? 'bg-slate-950/60 border-slate-805' : 'bg-slate-50 border-slate-220'}`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-500/15 text-blue-600 dark:text-sky-400 rounded-lg">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="text-left w-full">
                                <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-sky-400">Primary Administrator Status</p>
                                <p className="text-xs font-semibold font-mono text-slate-400 mt-0.5">Authorized via Secure CMS Credentials</p>
                              </div>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-504/20 text-[9px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full select-none">
                              Authorized Session
                            </span>
                          </div>
                        </div>

                        {/* Database backups */}
                        <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <Settings className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                            <h4 className="text-lg font-bold uppercase tracking-wide">CMS Portfolio Database</h4>
                          </div>
                          <p className={`text-xs max-w-2xl leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Your portfolio configurations reside in high-speed, secure local browser cache. High-resolution images are backed up directly to Amazon S3. If you need to revert to the default catalog data, you can reset the collections here.
                          </p>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={handleFactoryReset}
                              className="flex items-center justify-center gap-2 border border-rose-500/25 hover:bg-rose-500/10 text-rose-500 font-bold tracking-widest text-[11px] uppercase py-3.5 px-6 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <span>Revert Database Settings</span>
                            </button>
                            
                            <button 
                              onClick={() => {
                                // Dynamic JSON configuration export
                                const backup = {
                                  photos,
                                  categories,
                                  version: '1.0'
                                };
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
                                const downloadAnchor = document.createElement('a');
                                downloadAnchor.setAttribute("href", dataStr);
                                downloadAnchor.setAttribute("download", "manx_media_backup.json");
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="flex items-center justify-center gap-2 border dark:border-slate-800 border-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-sky-405 hover:border-blue-400 dark:hover:border-sky-400 font-bold tracking-widest text-[11px] uppercase py-3.5 px-6 rounded-xl transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span>Export Gallary Json Backup</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

          </section>
        )}

      </main>

      {/* =============================================================== */}
      {/* INTERACTIVE FULL ASPECT LIGHTBOX OVERLAY */}
      {/* =============================================================== */}
      {lightboxIndex !== null && activePhotos.length > 0 && (
        <div 
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 bg-slate-950/98 z-50 flex items-center justify-center p-4 md:p-8 animate-fadeIn"
          id="gallery-lightbox-overlay"
        >
          {/* Main Container */}
          <div className="relative w-full h-full flex flex-col justify-between max-w-6xl mx-auto py-4">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 text-white z-10 p-2 border-b border-slate-900 bg-slate-950/80 backdrop-blur rounded-2xl mb-2 md:mb-4 w-full">
              <div className="flex items-center justify-between w-full md:w-auto gap-3 select-none px-2 py-1 md:p-0">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-500/20 text-blue-600 dark:text-sky-400 font-black tracking-widest text-[9px] uppercase py-0.5 px-2.5 rounded border border-blue-500/20">
                    {activePhotos[lightboxIndex]?.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold tracking-wider">
                    {lightboxIndex + 1} of {activePhotos.length}
                  </span>
                </div>
                
                {slideshowActive && (
                  <span className="flex md:hidden items-center gap-1 bg-emerald-500/10 text-emerald-500 font-black tracking-widest text-[8px] uppercase py-0.5 px-2.5 rounded border border-emerald-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Autoplay Active
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto bg-slate-900/50 md:bg-transparent p-1 md:p-0 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 flex-1 md:flex-none justify-evenly md:justify-start">
                  {/* Slideshow Button (Change 3) */}
                  <button
                    onClick={() => setSlideshowActive(prev => !prev)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 flex-1 md:flex-none rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      slideshowActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                    title={slideshowActive ? 'Pause slideshow autoplay' : 'Play slideshow autoplay (3s interval)'}
                  >
                    {slideshowActive ? <Pause className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Play className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                    <span className="hidden md:inline">{slideshowActive ? 'Pause' : 'Autoplay'}</span>
                  </button>

                  {/* Secure Download Button (Change 3) */}
                  <button
                    onClick={(e) => handleDownloadLightboxImage(e, activePhotos[lightboxIndex]?.imageUrl || '', activePhotos[lightboxIndex]?.title || '')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 flex-1 md:flex-none rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                    title="Download full quality image"
                  >
                    <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    <span className="hidden md:inline">Download</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={(e) => handleShareLightboxImage(e, activePhotos[lightboxIndex]?.imageUrl || '')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 flex-1 md:flex-none rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      shareCopied 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                    title="Copy image link"
                  >
                    {shareCopied ? <Check className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Share2 className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                    <span className="hidden md:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pl-2 md:pl-0 border-l border-slate-800 md:border-none">
                  <div className="hidden md:block w-px h-6 bg-slate-800 mx-1"></div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                    className="flex items-center justify-center hover:text-red-500 bg-slate-900 border border-slate-800 text-slate-450 cursor-pointer p-2 md:py-2 md:px-3 rounded-lg hover:border-red-500/30 transition-all group"
                    title="Exit lightbox (Esc)"
                  >
                    <X className="w-5 h-5 md:w-4 md:h-4 text-slate-300 group-hover:text-red-500" />
                    <span className="hidden md:inline ml-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover:text-red-500">Close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Middle slider & Image panel */}
            <div 
              className="flex-1 flex items-center justify-between gap-2 md:gap-4 relative touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Prev command */}
              <button 
                onClick={handlePrevLightbox}
                className="absolute left-0 md:left-4 z-10 bg-black/40 hover:bg-black/85 border border-slate-800 text-white p-3 md:p-4 rounded-full transition-colors cursor-pointer"
                title="Previous capture"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central image display frame */}
              <div className="w-full h-[60vh] md:h-[70vh] flex items-center justify-center p-2 z-0 scale-up">
                <img 
                  onClick={(e) => e.stopPropagation()}
                  src={activePhotos[lightboxIndex]?.imageUrl} 
                  alt={activePhotos[lightboxIndex]?.title} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl scale-up select-none"
                  referrerPolicy="no-referrer"
                  id="lightbox-image-viewport"
                />
              </div>

              {/* Next command */}
              <button 
                onClick={handleNextLightbox}
                className="absolute right-0 md:right-4 z-10 bg-black/40 hover:bg-black/85 border border-slate-800 text-white p-3 md:p-4 rounded-full transition-colors cursor-pointer"
                title="Next capture"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom info panel */}
            <div className="text-center text-white p-4 max-w-2xl mx-auto z-10 select-none bg-slate-900/50 backdrop-blur border border-slate-900 rounded-2xl w-full">
              <h3 className="font-extrabold text-lg md:text-xl uppercase tracking-wide mb-1 text-blue-600 dark:text-sky-450 leading-snug">
                {activePhotos[lightboxIndex]?.title}
              </h3>
              <p className="text-xs md:text-sm text-slate-350 leading-relaxed italic mb-3">
                "{activePhotos[lightboxIndex]?.description}"
              </p>

              {activePhotos[lightboxIndex]?.exif && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 py-3 px-4.5 mb-3 border-t border-b border-slate-800 bg-slate-950/60 rounded-xl text-left">
                  {activePhotos[lightboxIndex]?.exif?.camera && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">Camera</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.camera}</span>
                    </div>
                  )}
                  {activePhotos[lightboxIndex]?.exif?.lens && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">Lens</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.lens}</span>
                    </div>
                  )}
                  {activePhotos[lightboxIndex]?.exif?.iso && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">ISO</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.iso}</span>
                    </div>
                  )}
                  {activePhotos[lightboxIndex]?.exif?.shutterSpeed && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">Shutter</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.shutterSpeed}</span>
                    </div>
                  )}
                  {activePhotos[lightboxIndex]?.exif?.aperture && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">Aperture</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.aperture}</span>
                    </div>
                  )}
                  {activePhotos[lightboxIndex]?.exif?.focalLength && (
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-extrabold tracking-wider uppercase text-slate-500">Focal L.</span>
                      <span className="block text-[10px] font-bold font-mono text-slate-300 truncate">{activePhotos[lightboxIndex]?.exif?.focalLength}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center items-center gap-4 text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest">
                <span>Date Captured: {new Date(activePhotos[lightboxIndex]?.createdAt).toLocaleDateString()}</span>
                {activePhotos[lightboxIndex]?.isFeatured && (
                  <span className="text-blue-500 dark:text-sky-400 font-extrabold">✦ Curated Selection</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* CMS DESIGN: PHOTO EDITING AND ASSET REPLACEMENT MODAL */}
      {/* =============================================================== */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fadeIn text-left text-slate-100">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 md:p-8 relative ${darkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-950 border-slate-200'}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-800 border-slate-200">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-sky-400">
                <Settings className="w-5 h-5" />
                <h3 className="text-base md:text-lg font-black uppercase tracking-widest">Edit Photograph Settings</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="hover:text-rose-500 p-1.5 rounded-full hover:bg-slate-500/10 transition-colors cursor-pointer"
                title="Cancel modifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPhotoSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Visual Area & Replacement Upload */}
              <div className="md:col-span-5 space-y-4">
                <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 text-left">
                  Current / Replacement Asset
                </label>
                
                {/* Visual Viewport */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden border dark:border-slate-800 border-slate-200 bg-slate-950 flex items-center justify-center relative group">
                  <img 
                    src={editPreview || editingPhoto.imageUrl} 
                    alt="Viewport draft" 
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {editPreview && (
                    <div className="absolute inset-x-0 bottom-0 bg-emerald-500/90 text-[9px] text-slate-950 font-black uppercase py-1 text-center tracking-widest leading-none">
                      ★ Replacement Selected
                    </div>
                  )}
                </div>

                {/* Drag / Upload trigger context */}
                <div 
                  onClick={() => {
                    const el = document.getElementById('replace-photo-input') as HTMLInputElement;
                    if (el) el.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl py-4 px-4 text-center cursor-pointer transition-colors ${darkMode ? 'border-slate-805 bg-slate-950/40 hover:border-slate-700' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
                >
                  <Upload className="w-6 h-6 mb-1.5 text-slate-500 mx-auto" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block mb-0.5">Replace Photograph Image</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-medium">Click to select new image asset</span>
                  <input 
                    id="replace-photo-input"
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        setEditFile(files[0]);
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          if (re.target?.result) setEditPreview(re.target.result as string);
                        };
                        reader.readAsDataURL(files[0]);
                      }
                    }}
                    className="hidden" 
                  />
                </div>

                {editPreview && (
                  <button 
                    type="button" 
                    onClick={() => { setEditFile(null); setEditPreview(null); }}
                    className="w-full text-center text-[10px] uppercase tracking-widest text-rose-500 font-bold hover:underline"
                  >
                    Reset to original photograph
                  </button>
                )}
              </div>

              {/* Right Column: Metadata fields */}
              <div className="md:col-span-7 space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-1.5 text-left">
                    Photograph Title *
                  </label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full py-2.5 px-4 text-xs rounded-xl font-bold uppercase border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-655' : 'border-slate-205 text-slate-950 placeholder-slate-400'}`}
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-1.5 text-left">
                    Category Album *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className={`w-full py-2.5 px-4 text-xs rounded-xl font-semibold border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-202 text-slate-950'}`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-950'}`}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase block text-blue-600 dark:text-sky-450 mb-1.5 text-left">
                    Description & Exposure parameters
                  </label>
                  <textarea 
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`w-full py-2.5 px-4 text-xs rounded-xl font-medium border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-205 text-slate-955 placeholder-slate-400'}`}
                  />
                </div>

                {/* Camera EXIF Metadata (Optional) */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left">
                  <h6 className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <span>📷 Camera & Capture Settings (EXIF)</span>
                  </h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">Camera Body</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sony A7R V"
                        value={editCamera}
                        onChange={(e) => setEditCamera(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">Lens</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 24-70mm f/2.8"
                        value={editLens}
                        onChange={(e) => setEditLens(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">ISO</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 100"
                        value={editIso}
                        onChange={(e) => setEditIso(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">Shutter Speed</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1/125s"
                        value={editShutterSpeed}
                        onChange={(e) => setEditShutterSpeed(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">Aperture</label>
                      <input 
                        type="text" 
                        placeholder="e.g. f/8"
                        value={editAperture}
                        onChange={(e) => setEditAperture(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold tracking-wider uppercase block text-slate-400 dark:text-slate-500 mb-1">Focal Length</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 24mm"
                        value={editFocalLength}
                        onChange={(e) => setEditFocalLength(e.target.value)}
                        className={`w-full py-1.5 px-3 text-2xs rounded-lg border bg-transparent focus:outline-none transition-all ${darkMode ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-950 placeholder-slate-400'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Curated/Featured and Published Toggles */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-t border-b dark:border-slate-800/80 border-slate-150 my-2">
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold select-none">
                    <input 
                      type="checkbox"
                      checked={editIsFeatured}
                      onChange={(e) => setEditIsFeatured(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 cursor-pointer accent-blue-600 focus:ring-0"
                    />
                    <div className="flex flex-col text-left">
                      <span className="uppercase tracking-wide text-xs">Curated feature</span>
                      <span className="text-[9px] text-slate-500">Highlight on modern landing page</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold select-none">
                    <input 
                      type="checkbox"
                      checked={editIsPublished}
                      onChange={(e) => setEditIsPublished(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-blue-600 border-slate-705 bg-slate-900 cursor-pointer accent-blue-600 focus:ring-0"
                    />
                    <div className="flex flex-col text-left">
                      <span className="uppercase tracking-wide text-xs">Publish Immediately</span>
                      <span className="text-[9px] text-slate-500">Uncheck to save as single draft</span>
                    </div>
                  </label>
                </div>

                {/* Call Action buttons footer */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isEditingSaving}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black tracking-widest text-xs uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 shadow hover:shadow-lg transition-all active:scale-98 select-none cursor-pointer"
                  >
                    {isEditingSaving ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        <span>Updating Asset details...</span>
                      </>
                    ) : (
                      <span>Save Photograph Settings</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPhoto(null)}
                    className={`py-3.5 px-6 font-bold tracking-widest text-xs uppercase rounded-xl cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* VISUAL LAYOUT FOOTER */}
      {/* =============================================================== */}
      <footer id="portfolio-general-footer" className={`border-t py-12 md:py-16 transition-colors ${darkMode ? 'border-slate-900 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-650'}`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:items-center">
          
          <div className="md:col-span-5 text-left">
            <h4 className="text-slate-950 dark:text-slate-100 font-black tracking-widest text-lg uppercase col-span-5">
              MANX <span className="text-blue-600 dark:text-sky-400 font-extrabold">MEDIA</span>
            </h4>
            <p className="text-xs tracking-wider uppercase text-slate-500 font-bold mt-1">PHOTOGRAPHY PORTFOLIO BY JACOB CROWE</p>
            <p className="text-xs leading-relaxed text-slate-400 mt-4 max-w-sm font-sans select-none">
              High-contrast composition work, framing deep-cut geography, coastal weather, and high-fidelity automotive capture. Seeding visual weight to every digital medium.
            </p>
          </div>

          {/* Quick links footer list */}
          <div className="md:col-span-3 flex flex-col space-y-2.5 text-xs text-left tracking-widest font-bold uppercase">
            <h5 className="text-[10px] tracking-[0.25em] text-slate-500 font-semibold mb-1">Portfolio Tabs</h5>
            <button onClick={() => { setActiveTab('home'); }} className="hover:text-blue-600 dark:hover:text-sky-400 text-left cursor-pointer select-none">Home Splash</button>
            <button onClick={() => { setActiveTab('gallery'); }} className="hover:text-blue-600 dark:hover:text-sky-400 text-left cursor-pointer select-none">Portfolio Grid</button>
            <button onClick={() => { setActiveTab('about'); }} className="hover:text-blue-600 dark:hover:text-sky-400 text-left cursor-pointer select-none">Artist Story</button>
            <button onClick={() => { setActiveTab('contact'); }} className="hover:text-blue-600 dark:hover:text-sky-400 text-left cursor-pointer select-none">Project Booking</button>
          </div>

          {/* Copyright context */}
          <div className="md:col-span-4 text-left md:text-right text-xs flex flex-col space-y-2 select-none">
            <p className="text-slate-500 tracking-wider">
              © {new Date().getFullYear()} Manx Media. All rights reserved.
            </p>
            <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-650' : 'text-slate-400'}`}>
              Structured via elegant design principles. Managed offline-first via sandboxed browser engines.
            </p>
            <div className="flex justify-start md:justify-end gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('admin')}
                className="hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1.5 focus:outline-none text-[10px] tracking-widest font-bold uppercase transition bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 dark:border-slate-800 border border-slate-200 py-1.5 px-3.5 rounded-full select-none text-slate-505 dark:text-slate-400 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-blue-600 dark:text-sky-450" />
                <span>CMS Secure Access</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
