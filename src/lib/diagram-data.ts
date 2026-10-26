import type { Edge, Node } from '@xyflow/react';

export type DiagramKind = 'usecase' | 'class';
export type DiagramNode = Node<{ label: string; shape: 'actor' | 'usecase' | 'class' }>;
export type DiagramData = { nodes: DiagramNode[]; edges: Edge[] };
const node = (id: string, label: string, x: number, y: number, shape: DiagramNode['data']['shape']): DiagramNode => ({ id, type: 'uml', position: { x, y }, data: { label, shape } });
export const sampleDiagrams: Record<DiagramKind, DiagramData> = {
  usecase: {
    nodes: [node('customer', 'Customer', 10, 90, 'actor'), node('browse', 'Browse Restaurants', 160, 10, 'usecase'), node('order', 'Place Order', 160, 100, 'usecase'), node('history', 'View Order History', 160, 190, 'usecase'), node('payment', 'Make Payment', 390, 10, 'usecase'), node('track', 'Track Delivery', 390, 100, 'usecase'), node('menu', 'Manage Menu', 620, 100, 'usecase'), node('admin', 'Admin', 840, 90, 'actor')],
    edges: [{ id: 'e1', source: 'customer', target: 'browse' }, { id: 'e2', source: 'customer', target: 'order' }, { id: 'e3', source: 'customer', target: 'history' }, { id: 'e4', source: 'order', target: 'payment', label: '«include»', animated: false }, { id: 'e5', source: 'order', target: 'track', label: '«include»' }, { id: 'e6', source: 'track', target: 'menu' }, { id: 'e7', source: 'menu', target: 'admin' }],
  },
  class: {
    nodes: [node('customer', 'Customer', 0, 80, 'class'), node('order', 'Order', 240, 80, 'class'), node('item', 'OrderItem', 480, 80, 'class'), node('restaurant', 'Restaurant', 720, 80, 'class')],
    edges: [{ id: 'c1', source: 'customer', target: 'order' }, { id: 'c2', source: 'order', target: 'item' }, { id: 'c3', source: 'item', target: 'restaurant' }],
  },
};
export const sampleStories = [
  'As a student, I want to browse restaurants so that I can find food near campus.',
  'As a student, I want to place an order and track it in real-time, so that I know when my food will arrive.',
  'As a restaurant owner, I want to manage my menu and update inventory easily and fast, so that I can operate my restaurant efficiently.',
  'As a student, I want to pay securely so that I can complete my order.',
  'As a student, I want to view my order history so that I can reorder my favorite meals.',
  'As a faculty member, I want to order food to my office so that I can eat between classes.',
  'As a staff member, I want to select a campus delivery location so that my order reaches me.',
  'As a delivery rider, I want to view assigned orders so that I can plan my deliveries.',
  'As a delivery rider, I want to update delivery status so that customers stay informed.',
  'As a restaurant owner, I want to accept orders so that I can prepare meals on time.',
  'As an admin, I want to manage restaurants so that only approved vendors appear.',
  'As an admin, I want to resolve order issues so that users receive support.',
];