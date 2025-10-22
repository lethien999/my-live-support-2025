// Mock Redis Service - Not actually used
export const redisService = {
  isReady: () => false,
  connect: async () => {},
  disconnect: async () => {},
  addUserToRoom: async (roomId: string, userId: string | number) => {},
  publishMessage: async (roomId: string, message: any) => {},
  cacheMessage: async (roomId: string, messageId: string, message: any) => {},
  setTyping: async (roomId: string, userId: string | number, isTyping: boolean) => {}
};
