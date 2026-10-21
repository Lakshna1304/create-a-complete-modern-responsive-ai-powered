import Common "common";

module {
  public type Timestamp = Common.Timestamp;
  public type MessageId = Common.MessageId;
  public type ImageId = Common.ImageId;
  public type ChatRole = Common.ChatRole;
  public type ChatMessage = Common.ChatMessage;
  public type AiError = Common.AiError;
  public type AiResult<T> = Common.AiResult<T>;

  /// One prior turn supplied as conversation context by the caller.
  public type ChatContextTurn = {
    role : ChatRole;
    content : Text;
  };

  /// Request for the shared assistant chat endpoint.
  public type ChatRequest = {
    message : Text;
    context : [ChatContextTurn];
  };

  /// Reply returned by the shared assistant chat endpoint.
  public type ChatReply = {
    reply : Text;
    createdAt : Timestamp;
  };

  /// Request for the text simplification endpoint.
  public type SimplifyRequest = {
    text : Text;
  };

  /// Request for the summarization endpoint.
  public type SummarizeRequest = {
    text : Text;
  };

  /// Key points returned by the summarization endpoint.
  public type SummaryResult = {
    keyPoints : [Text];
  };

  /// Request for the step-by-step instruction endpoint.
  public type StepsRequest = {
    task : Text;
  };

  /// Ordered steps returned by the instruction endpoint.
  public type StepsResult = {
    steps : [Text];
  };

  /// Request for the image description endpoint.
  ///
  /// `context` carries any text the caller already has about the image
  /// (a caption, or text extracted on the client). The platform inference
  /// client serves text models only, so the description is produced from
  /// this text plus the filename — never from pixels.
  public type DescribeImageRequest = {
    imageId : ImageId;
    context : ?Text;
  };

  /// Written description of an uploaded image.
  public type ImageDescription = {
    description : Text;
    readableText : Text;
  };
};
