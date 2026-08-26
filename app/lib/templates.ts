export type TextSlot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  fontSize?: number;
  placeholder?: string;
};

export type MemeTemplate = {
  id: string;
  name: string;
  image: string;
  tags: string[];
  slots: TextSlot[];
  defaults: Record<string, string>;
  allowMiddle?: boolean;
};

const classicSlots: TextSlot[] = [
  { id: 'top', label: 'Top text', x: 0.5, y: 0.1, width: 0.9 },
  { id: 'bottom', label: 'Bottom text', x: 0.5, y: 0.9, width: 0.9 },
];

const classic = (id: string, name: string, image: string, tags: string[], top: string, bottom: string): MemeTemplate => ({
  id, name, image, tags, slots: classicSlots, defaults: { top, bottom }, allowMiddle: true,
});

export const memeTemplates: MemeTemplate[] = [
  classic('doge', 'Doge', '/templates/doge.jpg', ['doge', 'reaction', 'wow'], 'SUCH TEMPLATE', 'VERY MEME'),
  classic('facepalm', 'Facepalm', '/templates/facepalm.jpg', ['facepalm', 'reaction', 'mistake'], 'WHEN THE FIX', 'BREAKS PRODUCTION'),
  classic('hide-the-pain-harold', 'Hide the Pain Harold', '/templates/hide-the-pain-harold.jpg', ['harold', 'pain', 'smile'], 'WHEN THEY SAY', 'JUST ONE SMALL CHANGE'),
  classic('that-would-be-great', 'That Would Be Great', '/templates/that-would-be-great.jpg', ['office', 'request', 'great'], 'IF YOU COULD SHIP TODAY', 'THAT WOULD BE GREAT'),
  classic('roll-safe', 'Roll Safe', '/templates/roll-safe.jpg', ['roll-safe', 'thinking', 'logic'], "CAN'T MISS THE DEADLINE", "IF YOU DON'T SET ONE"),
  classic('success-kid', 'Success Kid', '/templates/success-kid.jpg', ['success', 'win', 'kid'], 'DEPLOYED ON FRIDAY', 'NOTHING BROKE'),
  {
    id: 'drakeposting', name: 'Drakeposting', image: '/templates/drakeposting.jpg', tags: ['drake', 'choice', 'comparison'],
    slots: [
      { id: 'reject', label: 'Rejected option', x: 0.73, y: 0.25, width: 0.43, fontSize: 0.07 },
      { id: 'approve', label: 'Preferred option', x: 0.73, y: 0.75, width: 0.43, fontSize: 0.07 },
    ],
    defaults: { reject: 'MANUAL DEPLOYS', approve: 'ONE BUTTON SHIP' },
  },
  {
    id: 'anakin-padme', name: 'Anakin Padmé', image: '/templates/anakin-padme.png', tags: ['anakin', 'padme', 'four-panel'],
    slots: [
      { id: 'panel-1', label: 'Panel 1', x: 0.25, y: 0.43, width: 0.44, fontSize: 0.055 },
      { id: 'panel-2', label: 'Panel 2', x: 0.75, y: 0.43, width: 0.44, fontSize: 0.055 },
      { id: 'panel-3', label: 'Panel 3', x: 0.25, y: 0.92, width: 0.44, fontSize: 0.055 },
      { id: 'panel-4', label: 'Panel 4', x: 0.75, y: 0.92, width: 0.44, fontSize: 0.055 },
    ],
    defaults: { 'panel-1': 'WE ADDED TESTS', 'panel-2': 'SO IT IS SAFE?', 'panel-3': '', 'panel-4': 'IT IS SAFE, RIGHT?' },
  },
  {
    id: 'bike-fall', name: 'Bike Fall', image: '/templates/bike-fall.jpg', tags: ['bike', 'fall', 'self-sabotage'],
    slots: [
      { id: 'panel-1', label: 'Panel 1', x: 0.5, y: 0.08, width: 0.82, fontSize: 0.06 },
      { id: 'panel-2', label: 'Panel 2', x: 0.5, y: 0.42, width: 0.82, fontSize: 0.06 },
      { id: 'panel-3', label: 'Panel 3', x: 0.5, y: 0.75, width: 0.82, fontSize: 0.06 },
    ],
    defaults: { 'panel-1': 'SKIP THE REVIEW', 'panel-2': 'SHIP THE BUG', 'panel-3': 'WHY WOULD CI DO THIS?' },
  },
  classic('disaster-girl', 'Disaster Girl', '/templates/disaster-girl.jpg', ['disaster', 'fire', 'reaction'], 'ME AFTER THE DEPLOY', 'EVERYTHING IS FINE'),
  {
    id: 'distracted-boyfriend', name: 'Distracted Boyfriend', image: '/templates/distracted-boyfriend.jpg', tags: ['distracted', 'choice', 'labels'],
    slots: [
      { id: 'new-thing', label: 'New thing', x: 0.2, y: 0.77, width: 0.3, fontSize: 0.055 },
      { id: 'me', label: 'Person', x: 0.55, y: 0.55, width: 0.25, fontSize: 0.055 },
      { id: 'old-thing', label: 'Old thing', x: 0.83, y: 0.56, width: 0.27, fontSize: 0.055 },
    ],
    defaults: { 'new-thing': 'NEW FRAMEWORK', me: 'ME', 'old-thing': 'STABLE STACK' },
  },
  classic('jackie-chan-confused', 'Jackie Chan Confused', '/templates/jackie-chan-confused.jpg', ['jackie-chan', 'confused', 'reaction'], 'THE TICKET SAYS', 'WORKS AS DESIGNED'),
  classic('one-does-not-simply', 'One Does Not Simply', '/templates/one-does-not-simply.jpg', ['boromir', 'one-does-not-simply', 'challenge'], 'ONE DOES NOT SIMPLY', 'DEPLOY WITHOUT TESTS'),
  classic('x-everywhere', 'X Everywhere', '/templates/x-everywhere.jpg', ['toy-story', 'everywhere', 'buzz'], 'EDGE CASES', 'EDGE CASES EVERYWHERE'),
];

export const optionalMiddleSlot: TextSlot = {
  id: 'middle', label: 'Middle text', x: 0.5, y: 0.5, width: 0.82, fontSize: 0.065, placeholder: 'Middle text (optional)',
};
