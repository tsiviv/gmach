import axios from 'axios';

const url = 'http://localhost:4000'; // בהתאם לשרת שלך

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
});

// קבלת סטטוס ההתראות הנוכחי
export const getNotificationsStatus = async () => {
  try {
    const res = await axios.get(`${url}/Notification/get-notifications`, getAuthHeaders());
    return res.data.enabled;
  } catch (error) {
    console.error('שגיאה בקבלת סטטוס התראות:', error);
    throw error;
  }
};

// עדכון סטטוס ההתראות
export const setNotificationsStatus = async (enabled) => {
  try {
    const res = await axios.post(
      `${url}/Notification/set-notifications`,
      { enabled },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס התראות:', error);
    throw error;
  }
};
