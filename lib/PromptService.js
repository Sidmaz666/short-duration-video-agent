function generateVideoPrompt({ prompt }) {
  const randomSeed = Math.floor(Math.random() * 1000000) + 1;
  // Return the JSON as a string
  return [
    {
      role: "system",
      content: `
  Generate a comprehensive JSON output for a video tailored for Instagram Reels and YouTube Shorts from the given user input prompt.
  Additionally, leverage the random seed number to ensure unique content generation.
  Analyze the prompt and determine the niche.
  Analyze the prompt and comeup with a topic.
  The output should consistently follow the defined JSON structure below:
  
  [TTSMP3 Information]
  Input limit: 3,000 characters
  Don't forget to turn on your speakers :-)
  Hint: If you finish a sentence, leave a space after the dot before the next one starts for better pronunciation.
  TTSMP3 Features (SSML):
  Add a break:
  Mary had a little lamb <break time="1s"/> Whose fleece was white as snow.
  Emphasizing words:
  I already told you I <emphasis level="strong">really like </emphasis> that person.
  Speed:
  For dramatic purposes, you might wish to <prosody rate="slow">slow down the speaking rate of your text.</prosody>
  Or if you are in a hurry <prosody rate="fast">your may want to speed it up a bit.</prosody>
  Pitch:
  Do you like synthesized speech <prosody pitch="high">with a pitch that is higher than normal?</prosody>
  Or do you prefer your speech <prosody pitch="-20%">with a somewhat lower pitch?</prosody>
  Whisper:
  <amazon:effect name="whispered">If you make any noise, </amazon:effect> she said, <amazon:effect name="whispered">they will hear us.</amazon:effect>
  Conversations:
  [speaker:Brian] Hello Emma
  [speaker:Emma] Hey Brian
  [speaker:Brian] How are you doing?
  [speaker:Emma] I am fine. May I invite you to a cup of tea?
  Note: Remove any diacritical signs from the speakers' names when using this (e.g., Léa = Lea, Penélope = Penelope).
  [TTSMP3 Information]
  
  
  {
    "niche": "[String: User Input or Empty]",
    "topic": "[String: User Input or Empty]",
    "random_seed": "[Number: Random Seed Number (1 to Infinity)]",
    "video": {
      "title": "[String: Generated Title]",
      "hook": "[String: Compelling Hook]",
      "caption": "[String: Video Caption or Description]",
      "layout": [
        {
          "id": "[String: Unique Segment ID]",
          "timestamp": "[String: HH:MM:SS]",
          "segment_title": "[String: Segment Title]",
          "dialogue": [
            "[String: Short Humorous Dialogue Line 1]",
            "[String: Short Humorous Dialogue Line 2]",
            "[String: Short Humorous Dialogue Line 3]"
          ],
          "images": [
            {
              "id": "[String: Unique Image ID, Format: image_{numeric_number}, Example: image_1]",
              "prompt": "[Detailed Flux Image Prompt 1 including setting, action/emotion, color palette, artistic style, texture and detail, contrast, saturation, environment, background, foreground]",
              "duration": "[Number: Duration in seconds]",
              "start_time": "[String: HH:MM:SS]",
              "end_time": "[String: HH:MM:SS]"
            },
            {
              "id": "[String: Unique Image ID 2]",
              "prompt": "[Detailed Flux Image Prompt 2 including setting, action/emotion, color palette, artistic style, texture and detail, contrast, saturation, environment, background, foreground]",
              "duration": "[Number: Duration in seconds]",
              "start_time": "[String: HH:MM:SS]",
              "end_time": "[String: HH:MM:SS]"
            }
          ],
          "transition": "[Enum: Transition Style (e.g., fade, fade-out, fade-in)]"
        },
        ...
      ],
      "music_type": "[String: Type of Music From:(
      action, adventure,ambient, calm,cinematic, dark, emotional, energetic,
      epic, fantasy, happy, horror, inspirational, medieval, mystical, relaxing,
      romantic, sad, suspense, uplifting)];
  
      "hashtags": [
        "[String: Hashtag 1]",
        "[String: Hashtag 2]"
      ]
    }
  }
  
  Ensure to include the following elements in the output:
  
  - **Niche**:
    Specify the niche (e.g., astrology, fantasy, self-improvement) as a string. 
  - **Topic**: 
    Create an engaging topic that invites users to think and participate (string).
  - **Random Seed**:
    A random seed number (integer) refering to the uniqueness of the content generated. This number should be between 1 and 1,000,000. If the user input is empty, generate a random seed number between 1 and 1,000,000"
  }.
  - **Title**: Generate a catchy title that reflects the content and sparks curiosity (string).
  - **Hook**: Develop a compelling hook to capture viewer interest within the first three seconds (string).
  - **Caption**: Provide a brief caption or description for the video that summarizes its content and encourages viewers to engage (string).
  - **Layout**: Outline the video content with detailed segments including IDs, timestamps, titles, dialogues (formatted for TTSMP3), image prompts (formatted for Flux), and recommended transitions.
  
  - **Dialogue**: For each segment, provide short and humorous dialogue that conveys emotion and context. Use puns or light-hearted humor to enhance engagement. Use the TTSMP3 Information provided to achieve the desired tone and flow:
    - Example Dialogue:
      - "Ever wonder what superpower your birth month gives you? Spoiler alert—it's not invisibility!"
      - "Which legendary sword would you wield? Choose wisely; it might not come with a warranty!"
      - "Let’s dive into these fun questions before I run out of puns!"
      - I already told you I <emphasis level="strong">really like </emphasis> that person.
  
  
  - **Images**: For each segment, generate detailed text descriptions for images suitable for Flux. Each description should include:
    - **ID**: A unique identifier for each image prompt (string).
    - **Prompt**: A comprehensive description that includes:
      - **Setting**: The environment or background in which the subject is located.
      - **Action or Emotion**: What the subject is doing or expressing.
      - **Color Palette**: Colors that dominate the scene to enhance visual appeal.
      - **Artistic Style**: Any artistic styles or influences.
      - **Texture and Detail**: Textures that should be prominent in the image.
      - **Contrast**: Describe the contrast levels in the image (e.g., high contrast for dramatic effect).
      - **Saturation**: Indicate saturation levels (e.g., vibrant colors or muted tones).
      - **Environment**: The overall atmosphere of the scene (e.g., magical, serene).
      - **Background**: Elements present in the background of the image.
      - **Foreground**: Elements present in the foreground of the image.
    - **Duration**: Specify how long the image will be displayed in seconds (number).
    - **Start Time**: Indicate when the image will start appearing in the video (string, HH:MM:SS).
    - **End Time**: Indicate when the image will stop appearing in the video (string, HH:MM:SS).
  
  - **Music Type**: Specify a type of music suitable for the theme (string) that enhances engagement.
  
  - **Hashtags**: Suggest relevant hashtags to maximize reach and encourage viewer interaction (array of strings).
  
  The output must adhere strictly to this JSON structure and include high-context image prompts suitable for use in Flux as well as natural-sounding dialogue formatted for TTSMP3. This will ensure consistency and ease of use in creating engaging Instagram Reels and YouTube Shorts that captivate viewers and encourage them to think and engage with the content.

EXAMPLE OF TOPIC IDEAS:
Here are few examples based on the niche "Anime":
- Your anime squad based on your favorite genre.
- The anime world you’d survive in based on your survival skills.
- Your anime mentor based on your life goals.
- The anime villain you’d team up with based on your flaws.
- Your anime love interest based on your ideal partner traits.

Here are few examples based on the niche "Manga":
- Your manga art style based on your creativity level.
- The manga genre you’d write based on your life story.
- Your manga protagonist role based on your personality.
- The manga panel that represents your current mood.
- Your manga rival based on your competitive streak.

Here are few examples based on the niche "Generic":
- Your superpower based on your favorite season.
- The mythical creature you’d be based on your spirit animal.
- Your dream vacation based on your bucket list.
- The historical figure you’d meet based on your values.
- Your alternate universe career based on your hidden talents.

Here are few examples based on the niche "Technology":
- Your AI assistant name based on your tech preferences.
- The gadget you’d invent based on your daily struggles.
- Your coding language based on your logical thinking.
- The futuristic tech you’d own based on your imagination.
- Your cyberpunk alter ego based on your online persona.

Here are few examples based on the niche "Geopolitics":
- The country you’d lead based on your diplomatic skills.
- Your global alliance based on your values and beliefs.
- The geopolitical crisis you’d solve based on your problem-solving style.
- Your foreign policy strategy based on your leadership approach.
- The historical empire you’d revive based on your vision for the future.

Here are few examples based on the niche "Literature":
- Your writing genre based on your storytelling style.
- The classic novel you’d rewrite based on your modern twist.
- Your fictional character based on your personality.
- The poetry style you’d master based on your emotions.
- Your book title based on your life story.

Here are few examples based on the niche "Music":
- Your music genre based on your mood.
- The instrument you’d play based on your creativity.
- Your concert lineup based on your favorite artists.
- The song lyrics that define your life based on your experiences.
- Your stage performance style based on your energy.

Here are few examples based on the niche "History":
- The historical era you’d thrive in based on your skills.
- Your historical figure alter ego based on your ambitions.
- The ancient civilization you’d explore based on your curiosity.
- Your battle strategy based on your tactical thinking.
- The historical event you’d witness based on your interests.

Here are few examples based on the niche "Psychology":
- Your personality archetype based on your behavior.
- The therapy approach you’d benefit from based on your struggles.
- Your coping mechanism based on your stress triggers.
- The psychological experiment you’d design based on your curiosity.
- Your emotional intelligence level based on your relationships.
  
  IMPORTANT:
  - Add multiple segments, to ensure video comes into an conclusion at the end.
  - Atleast add 6 to 8 segments! Add image prompts according to that.
  - One segment should only contain one dialogue!
  - Don't just add a lengthy/multiple dialogues, it should be based on the duration, image prompts of that segment. It can be just one or two words sometimes! It's not required to be a proper dialogue! However, it should make sense.
  - Please be very creative about making the content!.
  - Please ensure all TTSMP3 tags, such as <break time="1s"/>, <emphasis level="strong">, <prosody rate="slow">, <prosody pitch="high">, <amazon:effect name="whispered">, and speaker tags like [speaker:Name], are properly opened and closed, and that the content within them follows the correct syntax for accurate text-to-speech rendering. Please follow the TTSMP3 Information as provided.
  - Please don't use emojis in the content.
  - Please avoid changing the pitch in the dialogue! Use short breaks in dialogue if you want to, but not too much!
  
  
  PLEASE DO USE/FOLLOW THE CONTENT IDEA TOE TO TOE AS GIVEN BY THE USER  
  PROVIDE THE RESPONSE STRICTLY AS A VALID JSON OBJECT. DO NOT INCLUDE ANY ADDITIONAL TEXT, EXPLANATIONS, OR FORMATTING OUTSIDE THE JSON OBJECT. THE JSON MUST BE WELL-FORMED AND PARSABLE BY STANDARD JSON PARSERS. IF THE RESPONSE INCLUDES NESTED STRUCTURES, ENSURE THEY ARE PROPERLY FORMATTED AND ADHERE TO JSON STANDARDS
  `,
    },
    {
      role: "user",
      content: `${prompt}\nRANDOM SEED: ${randomSeed}`,
    },
  ];
}

module.exports = generateVideoPrompt;
