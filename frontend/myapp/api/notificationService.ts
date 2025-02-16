import axios from "axios";

export const APP_ID = 27521;
export const APP_TOKEN = 'rNRgdCvDNRU32d09grVuSh';

export const sendNotificationMessage = async (receiberId: string, title: string, message: string): Promise<string | undefined> => {
  try {
    const res = await axios.post(`https://app.nativenotify.com/api/indie/notification`, {
      subID: receiberId,
      appId: APP_ID,
      appToken: APP_TOKEN,
      title: title,
      message: message
    });
    console.log(res.data)
    return res.data; // return 'Success!'
  } catch (error) {
    console.error("Error al enviar la notificación: ", error);
  }
}