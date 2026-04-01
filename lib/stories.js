export const stories = [
  {
    subject: "The Bamboo Tree",
    story: "For five years, a Chinese bamboo tree shows no signs of growth above ground. It builds its root system. In the fifth year, it grows 80 feet in six weeks. Keep building your roots, {username}. When your time comes, your growth will be exponential."
  },
  {
    subject: "The Split in the Rock",
    story: "A single drop of water striking a rock consistently will eventually carve a path through solid stone. It is not the force of the drop, but the relentless consistency. Show up today, {username}, and cast your drop."
  },
  {
    subject: "The Two Wolves",
    story: "An elder told his grandson about a battle between two wolves inside us all. One is fear and laziness; the other is courage and discipline. The grandson asked which wolf wins. The elder replied: 'The one you feed.' Feed the right wolf today, {username}."
  },
  {
    subject: "The Obstacle is the Way",
    story: "When a king placed a boulder in the road, the peasants complained. A passing merchant pushed it aside and found a purse of gold beneath it. Every obstacle you face today, {username}, holds the hidden gold of opportunity and strength."
  },
  {
    subject: "The Butterfly's Struggle",
    story: "A man cut open a cocoon to help a butterfly escape, but the butterfly emerged with shriveled wings and died. The struggle to break the cocoon was necessary to push fluid into its wings. Your current struggles, {username}, are exactly what you need to fly."
  },
  {
    subject: "The Arrow's Principle",
    story: "An arrow can only be shot by pulling it backward. When life is dragging you back with difficulties, it means it's going to launch you into something great. Focus your aim today, {username}."
  },
  {
    subject: "The Elephant Rope",
    story: "Adult elephants are held by thin ropes because, as babies, the ropes were strong enough to hold them. They grew up believing they couldn't break free. What invisible ropes are still holding you back, {username}? Break them today."
  },
  {
    subject: "The Shark in the Tank",
    story: "Japanese fishermen solved the problem of stale fish by adding a small shark to the tank. The fish were challenged and stayed active, improving their quality. The challenges in your life, {username}, are your sharks. Let them keep you sharp."
  },
  {
    subject: "Sharpening the Axe",
    story: "Given six hours to chop down a tree, Abraham Lincoln said he'd spend the first four sharpening the axe. Your preparation, rest, and learning are not delays; they are you sharpening your axe. Strike with purpose today, {username}."
  },
  {
    subject: "The Jar of Rocks",
    story: "If you fill a jar with sand, you can't fit the big rocks in. But if you put the big rocks in first, the sand fills the gaps. Identify your 'big rocks'—your highest priorities—and tackle them first today, {username}."
  },
  {
    subject: "The Starfish Thrower",
    story: "A boy threw stranded starfish back into the ocean. A man told him there were too many; it wouldn't make a difference. The boy threw another and said, 'It made a difference to that one.' Every small action matters, {username}."
  },
  {
    subject: "Forging the Sword",
    story: "The strongest steel is forged in the hottest fire, struck repeatedly by the hammer. The pressure you feel right now is the universe forging you into an unbreakable weapon. Embrace the heat today, {username}."
  },
  {
    subject: "The Oak in the Wind",
    story: "A mighty oak rarely snaps in a hurricane because its roots are deep and it has learned to bend without breaking. Rigidity leads to failure. Adapt to today's challenges while standing firm in your values, {username}."
  },
  {
    subject: "The Lighthouse",
    story: "A lighthouse does not run around the island looking for boats to save; it just stands there shining its light. Focus on building and bettering yourself, {username}, and your light will naturally guide the way for others."
  },
  {
    subject: "The Marathon Mindset",
    story: "In a marathon, no one crosses the miles by leaping. They cross it one step at a time, looking at the ground directly in front of them. Don't look at the summit today, {username}. Just focus on taking the next step."
  }
];

export function getRandomStory() {
  const randomIndex = Math.floor(Math.random() * stories.length);
  return stories[randomIndex];
}
