import type { Email } from './types';

// Helper function to generate a random date within a range
const randomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const getMockEmails = (): Email[] => {
  const now = new Date();
  const fourYearsAgo = new Date();
  fourYearsAgo.setFullYear(now.getFullYear() - 4);

  const mockEmails: Email[] = [
    {
      id: '1',
      sender: 'newsletter@techcrunch.com',
      subject: 'Weekly Tech Roundup',
      body: 'Here is your weekly dose of tech news...',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '2',
      sender: 'no-reply@facebook.com',
      subject: 'John Doe tagged you in a photo',
      body: 'John Doe tagged you in a photo. Click here to see it.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '3',
      sender: 'security@google.com',
      subject: 'Security alert for your Google Account',
      body: 'A new sign-in was detected on your account.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '4',
      sender: 'support@amazon.com',
      subject: 'Your order has shipped!',
      body: 'Your order #123-4567890 has shipped.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '5',
      sender: 'team@slack.com',
      subject: 'New messages in #general',
      body: 'You have new unread messages in the general channel.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '6',
      sender: 'promotions@bestbuy.com',
      subject: '🎉 48-Hour Flash Sale!',
      body: 'Don\'t miss out on these amazing deals. Our flash sale ends in 48 hours!',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '7',
      sender: 'notifications@linkedin.com',
      subject: 'You appeared in 9 searches this week',
      body: 'See who\'s searching for you on LinkedIn.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '8',
      sender: 'updates@github.com',
      subject: '[GitHub] A new vulnerability was found in your repository',
      body: 'Dependabot has detected a new vulnerability in one of your dependencies.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '9',
      sender: 'digest@producthunt.com',
      subject: 'Top products of the day',
      body: 'Check out the top products trending on Product Hunt today.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '10',
      sender: 'info@expedia.com',
      subject: 'Your flight to San Francisco is confirmed',
      body: 'Booking confirmation for your upcoming trip to SFO.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '11',
      sender: 'forums@reddit.com',
      subject: 'Trending on r/programming: "I made a thing!"',
      body: 'Check out the top post on your favorite subreddit.',
      date: randomDate(fourYearsAgo, now),
    },
    {
      id: '12',
      sender: 'no-reply@twitter.com',
      subject: 'Your password was changed',
      body: 'Your password for your Twitter account was recently changed.',
      date: randomDate(fourYearsAgo, now),
    },
    ...Array.from({ length: 88 }, (_, i) => ({
      id: (13 + i).toString(),
      sender: `sender${i}@example.com`,
      subject: `Generic Subject Line ${i}`,
      body: `This is the body of a generic email #${i}. It could be a promotion, a social notification, or just another update.`,
      date: randomDate(fourYearsAgo, now),
    })),
  ];
  return mockEmails;
};
