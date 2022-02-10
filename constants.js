const ChatStatusNormal = 1;
const ChatStatusFavorite = 2;
const ChatStatusHidden = 3;

const CallStatusInitiated = 1;
const CallStatusAccepted = 2;
const CallStatusActive = 3;
const CallStatusRejected = 901;
const CallStatusEnded = 902;
const CallStatusIgnored = 903;
const CallStatusLost = 904;

const StatusOffline = 1;
const StatusOnline = 2;

const CallStartMessage = 900;
const CallRejectedMessage = 901;
const CallMissedMessage = 902;
const AttachedFile = 800;

module.exports = {
  ChatStatusNormal,
  ChatStatusFavorite,
  ChatStatusHidden,

  CallStatusInitiated,
  CallStatusAccepted,
  CallStatusActive,
  CallStatusRejected,
  CallStatusEnded,
  CallStatusIgnored,
  CallStatusLost,

  StatusOffline,
  StatusOnline,

  CallStartMessage,
  CallRejectedMessage,
  CallMissedMessage,
  AttachedFile,
};
