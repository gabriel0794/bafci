import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { CheckCircle, Error, Info, Warning } from '@mui/icons-material';

const iconStyle = {
  fontSize: 40,
  marginRight: 2,
};

const iconMap = {
  success: <CheckCircle color="success" sx={iconStyle} />,
  error: <Error color="error" sx={iconStyle} />,
  warning: <Warning color="warning" sx={iconStyle} />,
  info: <Info color="info" sx={iconStyle} />,
};

const CustomAlert = ({ open, onClose, title, message, severity = 'info' }) => {
  useEffect(() => {
    if (open && severity === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, severity, onClose]);

  const severityClasses = {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus-visible:outline-green-600'
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus-visible:outline-yellow-600'
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600'
    },
  };

  const currentSeverity = severityClasses[severity] || severityClasses.info;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-lg' }}>
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${currentSeverity.bg} sm:mx-0 sm:h-10 sm:w-10`}>
            <div className={`${currentSeverity.text}`}>
              {iconMap[severity]}
            </div>
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
      {severity !== 'success' && (
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto ${currentSeverity.button}`}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      )}
    </Dialog>
  );
};

export default CustomAlert;
