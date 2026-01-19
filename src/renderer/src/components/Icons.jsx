import React from 'react';

// Icon components with gradient support
export const EditIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="editGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="url(#editGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="url(#editGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const DocumentIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
        </defs>
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="url(#docGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2V8H20" stroke="url(#docGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 13H8" stroke="url(#docGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 17H8" stroke="url(#docGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 9H9H8" stroke="url(#docGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const DeleteIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="deleteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
        </defs>
        <path d="M3 6H5H21" stroke="url(#deleteGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="url(#deleteGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const AddIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="addGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <path d="M12 5V19" stroke="url(#addGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12H19" stroke="url(#addGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ExportIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="exportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6B7280" />
                <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>
        </defs>
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="url(#exportGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 10L12 15L17 10" stroke="url(#exportGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V3" stroke="url(#exportGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SaveIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="saveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="url(#saveGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 21V13H7V21" stroke="url(#saveGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3V8H15" stroke="url(#saveGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const CancelIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cancelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
        </defs>
        <path d="M18 6L6 18" stroke="url(#cancelGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6L18 18" stroke="url(#cancelGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SearchIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 21L16.65 16.65" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const DownloadIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="downloadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
        </defs>
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="url(#downloadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 10L12 15L17 10" stroke="url(#downloadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V3" stroke="url(#downloadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const UploadIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8L12 3L7 8" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3V15" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const UserIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="url(#userGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="url(#userGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const LockIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="url(#lockGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="url(#lockGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const RefreshIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
        </defs>
        <path d="M1 4V10H7" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 20V14H17" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27542C16.8482 4.26548 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const CheckIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <path d="M20 6L9 17L4 12" stroke="url(#checkGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const CloseIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
        </defs>
        <path d="M18 6L6 18" stroke="url(#closeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6L18 18" stroke="url(#closeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SendIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="sendGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
        </defs>
        <path d="M22 2L11 13" stroke="url(#sendGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="url(#sendGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ViewIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="viewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="url(#viewGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#viewGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ProcessIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="processGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
        </defs>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="url(#processGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SettingsIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>
        </defs>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#settingsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15C19.46 14.33 19.5 13.67 19.5 13H22C22.55 13 23 12.55 23 12C23 11.45 22.55 11 22 11H19.5C19.5 10.33 19.46 9.67 19.4 9L21.5 6.9C21.9 6.5 21.9 5.9 21.5 5.5L20 4C19.6 3.6 19 3.6 18.6 4L16.5 6.1C15.83 6.04 15.17 6 14.5 6V3.5C14.5 2.95 14.05 2.5 13.5 2.5H10.5C9.95 2.5 9.5 2.95 9.5 3.5V6C8.83 6 8.17 6.04 7.5 6.1L5.4 4C5 3.6 4.4 3.6 4 4L2.5 5.5C2.1 5.9 2.1 6.5 2.5 6.9L4.6 9C4.54 9.67 4.5 10.33 4.5 11H2C1.45 11 1 11.45 1 12C1 12.55 1.45 13 2 13H4.5C4.5 13.67 4.54 14.33 4.6 15L2.5 17.1C2.1 17.5 2.1 18.1 2.5 18.5L4 20C4.4 20.4 5 20.4 5.4 20L7.5 17.9C8.17 17.96 8.83 18 9.5 18V20.5C9.5 21.05 9.95 21.5 10.5 21.5H13.5C14.05 21.5 14.5 21.05 14.5 20.5V18C15.17 18 15.83 17.96 16.5 17.9L18.6 20C19 20.4 19.6 20.4 20 20L21.5 18.5C21.9 18.1 21.9 17.5 21.5 17.1L19.4 15Z" stroke="url(#settingsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SyncIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="syncGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <path d="M1 4V10H7" stroke="url(#syncGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 20V14H17" stroke="url(#syncGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27542C16.8482 4.26548 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="url(#syncGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const WarningIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <path d="M10.29 3.86L1.82 18C1.64538 18.3024 1.55296 18.6453 1.55196 18.9945C1.55096 19.3437 1.64141 19.6871 1.81437 19.9905C1.98732 20.294 2.23678 20.5467 2.53815 20.7225C2.83953 20.8983 3.18203 20.991 3.53 20.99H20.47C20.818 20.991 21.1605 20.8983 21.4618 20.7225C21.7632 20.5467 22.0127 20.294 22.1856 19.9905C22.3586 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9813 3.15392C12.6819 2.98471 12.3442 2.89487 12 2.89487C11.6558 2.89487 11.3181 2.98471 11.0187 3.15392C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="url(#warningGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9V13" stroke="url(#warningGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 17H12.01" stroke="url(#warningGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const BellIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="url(#bellGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="url(#bellGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
