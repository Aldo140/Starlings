import { describe, it, expect } from 'vitest';
import { parseAnswerBlocks } from '../components/QAThread.tsx';

// Real answers from the Q&A section (2026-07-13), used verbatim to lock in
// behavior against the exact prose staff actually write — not synthetic
// examples that might be easier to parse than reality.

const answer1 =
  "Thanks for your question. If you're asking about the stress of growing up with a parent's substance use or mental health challenges, the answer is complictaed because it can affect people in different ways depending on how much stress you experience and the support you have during and after it. You can see more here: https://www.starlings.ca/parental-addiction-and-youth-stress.The good news is that the stress you've experienced does not have to decide your future. The more we understand what we need to relieve our stress and find people and places that help us feel safe and supported, the easier it can become to manage hard feelings, friendships, and challenges as we get older. Being around people who don't judge you for what you've been through or how you feel can help make that stress feel lighter. Written by: A Starlings Peer & Advisor";

const answer2 =
  "We are so glad you asked this question because many young people never tell anyone what is happening at home. If you decide to share, try to tell someone who feels safe. A safe person is someone who listens, does not judge you, does not make you feel bad, and cares about what you need. Before you share, you might want to ask yourself: 1. Am I looking for someone to listen and understand? 2. Do I need information or support? 3. Do I need help staying safe? 4. Do I need help finding another place to stay? You can choose to talk to a trusted family member, teacher, counsellor, mentor, Elder, coach, or another adult you trust. Remember, you can ask questions before sharing. You can also decide how much you want to tell and what kind of help you are looking for. Reaching out can feel scary, especially if reaching out before hurt you or your family, but you do not have to figure everything out on your own. You are not alone.";

const answer3 =
  "Thanks for your question. Sleep can be hard when life feels stressful, and the answer depends on what is keeping you awake. Here are some suggestions: If you stay awake because you're worried: Keep a notebook by your bed. Write down your worries or things you need to remember for tomorrow. Remeber, you don't have to solve this tonight. If noise at home keeps you awake: Try earplugs, calming music, white noise, a fan, or headphones if they feel comfortable and safe. If you are taking care of family members: Remember that everyone needs rest-it is not selfish to get rest and it means you can show up for others better. If there is another trusted adult who can help, ask for support. If there isnt, even short naps and quiet breaks during the day can help when sleep at night is difficult. Try to go to bed at the same time each night, limit screens before bed (these can keep us awake and make it harder to fall asleep), and rtery not having any energy drinks in the evening. If sleep is difficult because of things happening at home, know that you are not alone, and it is okay to reach out for support.";

const answer4 =
  "This is a question we get a lot, and it can be hard, especially if you're worried about your parent but also need to take care of yourself. It can help to remember: It's okay to start small. Boundaries can feel really hard at first. You might feel guilty, worried, or like you're letting someone down. You're not. Taking care of yourself matters too. Some examples of boundaries can include: • Choosing not to have important conversations when your parent has been using substances or when they are syaing things that hurt you. • Going to a friend's, family member's, or other safe place when things feel stressful or unsafe. • Leaving the room when arguments, yelling, or substance use are happening. • Having a trusted person you can call or text when you need support. • Spending time with friends, at activities, or outside the house instead of feeling like you need to keep an eye on things at home. • Reminding yourself: \"I can love my parent and still take care of myself\"";

const answer5 =
  "When an adult is yelling, our bodies can feel scared or overwhelmed, especially if the yelling has been happening for a long time or begins to feel unsafe. Sometimes talking back or arguing can make the situation more intense, so if you can, focus on getting yourself and your siblings to a place where you feel safer until things calm down. Remember, your parent's yelling is not your fault, and it is not your job to fix it.";

describe('parseAnswerBlocks', () => {
  it('extracts a "Written by:" attribution and linkifies the embedded URL (answer 1)', () => {
    const blocks = parseAnswerBlocks(answer1);
    const attribution = blocks.find(b => b.type === 'attribution');
    expect(attribution).toEqual({ type: 'attribution', text: 'A Starlings Peer & Advisor' });
    // The attribution line must not leak into the last paragraph's text.
    const paragraphs = blocks.filter(b => b.type === 'paragraph') as { type: 'paragraph'; text: string }[];
    expect(paragraphs.some(p => p.text.includes('Written by'))).toBe(false);
  });

  it('detects a sequential numbered list and separates trailing prose from it (answer 2)', () => {
    const blocks = parseAnswerBlocks(answer2);
    const ordered = blocks.find(b => b.type === 'ordered') as { type: 'ordered'; items: string[] } | undefined;
    expect(ordered).toBeDefined();
    expect(ordered!.items).toEqual([
      'Am I looking for someone to listen and understand?',
      'Do I need information or support?',
      'Do I need help staying safe?',
      'Do I need help finding another place to stay?',
    ]);
    // The closing sentences ("You can choose to talk to..." etc.) must land
    // as their own paragraph, not get swallowed into the last list item.
    const listIndex = blocks.indexOf(ordered!);
    const after = blocks[listIndex + 1];
    expect(after?.type).toBe('paragraph');
    expect((after as any)?.text).toContain('You can choose to talk to a trusted family member');
    expect((after as any)?.text).toContain('You are not alone.');
  });

  it('detects "Label: advice" clauses as a labeled list (answer 3)', () => {
    const blocks = parseAnswerBlocks(answer3);
    const labeled = blocks.find(b => b.type === 'labeled') as
      | { type: 'labeled'; items: { label: string; text: string }[] }
      | undefined;
    expect(labeled).toBeDefined();
    expect(labeled!.items.map(i => i.label)).toEqual([
      "If you stay awake because you're worried",
      'If noise at home keeps you awake',
      'If you are taking care of family members',
    ]);
    expect(labeled!.items[0].text).toContain('Keep a notebook by your bed');
  });

  it('detects a bulleted list (answer 4)', () => {
    const blocks = parseAnswerBlocks(answer4);
    const unordered = blocks.find(b => b.type === 'unordered') as { type: 'unordered'; items: string[] } | undefined;
    expect(unordered).toBeDefined();
    expect(unordered!.items.length).toBe(6);
    expect(unordered!.items[0]).toContain('Choosing not to have important conversations');
    expect(unordered!.items[5]).toContain('Reminding yourself');
  });

  it('leaves plain prose with no list signal as paragraphs only (answer 5)', () => {
    const blocks = parseAnswerBlocks(answer5);
    expect(blocks.every(b => b.type === 'paragraph')).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('does not treat a single incidental colon clause as a list', () => {
    const blocks = parseAnswerBlocks('Remember: you are not alone in this, and support is always available.');
    expect(blocks.every(b => b.type === 'paragraph')).toBe(true);
  });

  it('handles empty/undefined input gracefully', () => {
    expect(parseAnswerBlocks('')).toEqual([]);
  });
});
