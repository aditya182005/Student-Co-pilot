import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from '../Layout';

describe('Layout', () => {
  it('renders children', () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );

    const childElement = screen.getByText('Test Child');
    expect(childElement).toBeInTheDocument();
  });
});
