import { useState } from 'react';

function DocumentModal({ show, onClose, pdfUrl }) {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)', // מוסיף אפקט טשטוש אם רוצים
        }}>
            <div style={{
                backgroundColor: '#fff',
                width: '90%',
                height: '90%',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                position: 'relative',
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 10000,
                    }}
                >
                    סגור
                </button>

                <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                >
                    <p>
                        לא ניתן להציג את הקובץ.{' '}
                        <a href={pdfUrl} target="_blank" rel="noreferrer">
                            לחץ כאן להורדה
                        </a>.
                    </p>
                </object>
            </div>
        </div>
    );
}
export default DocumentModal;