import axios from "axios";

export const sendNotificationMessage = async (receiberId: string, title: string, message: string): Promise<string | undefined> => {
  try {
    const res = await axios.post(`https://app.nativenotify.com/api/indie/notification`, {
      subID: receiberId,
      appId: 27248,
      appToken: 'g7bm81eIUEY0Mmtod4FmYb',
      title: title,
      message: message
    });
    return res.data; // return 'Success!'
  } catch (error) {
    console.error("Error al enviar la notificación: ", error);
  }
}