/** 플로팅 봇 UI 공통 */
const BotUi = {
  closeOthers(except) {
    if (except !== 'chatbot' && typeof Chatbot !== 'undefined' && Chatbot.isOpen) Chatbot.close();
    if (except !== 'imagebot' && typeof ImageBot !== 'undefined' && ImageBot.isOpen) ImageBot.close();
    if (except !== 'animebot' && typeof AnimeBot !== 'undefined' && AnimeBot.isOpen) AnimeBot.close();
  },
};
