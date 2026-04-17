import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ProjectUpdatesFeed } from '../ProjectUpdatesFeed';

test('renders project updates content', () => {
  render(
    createElement(ProjectUpdatesFeed, {
      isBacker: true,
      updates: [
        {
          id: 'update-1',
          project_id: 'project-1',
          creator_id: 'creator-1',
          title: 'Launch update',
          body: 'We are live and ready to go.',
          is_backers_only: false,
          created_at: '2025-05-15T00:00:00.000Z',
          updated_at: '2025-05-15T00:00:00.000Z',
        },
      ],
    })
  );

  expect(screen.getByRole('heading', { name: /campaign updates/i })).toBeInTheDocument();
  expect(screen.getByText('Launch update')).toBeInTheDocument();
});
