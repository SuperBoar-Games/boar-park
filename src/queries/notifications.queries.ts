// SQL queries for push subscriptions and in-app notifications

export const GET_UNREAD_NOTIFICATIONS_QUERY = `
  SELECT id, title, body, url, is_read, created_at
  FROM notifications
  WHERE user_id = $1 AND is_read = false
  ORDER BY created_at DESC
  LIMIT 50
`;

export const GET_ALL_NOTIFICATIONS_QUERY = `
  SELECT id, title, body, url, is_read, created_at
  FROM notifications
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT 100
`;

export const DELETE_OLD_READ_NOTIFICATIONS_QUERY = `
  DELETE FROM notifications
  WHERE user_id = $1 AND is_read = true AND created_at < NOW() - INTERVAL '7 days'
`;

export const GET_UNREAD_COUNT_QUERY = `
  SELECT COUNT(*)::int AS count
  FROM notifications
  WHERE user_id = $1 AND is_read = false
`;

export const INSERT_NOTIFICATIONS_FOR_ALL_USERS_QUERY = `
  INSERT INTO notifications (user_id, title, body, url)
  SELECT id, $1, $2, $3
  FROM users
  WHERE status = 'active'
`;

export const MARK_ALL_READ_QUERY = `
  UPDATE notifications
  SET is_read = true
  WHERE user_id = $1 AND is_read = false
`;

export const GET_ALL_PUSH_SUBSCRIPTIONS_QUERY = `
  SELECT id, endpoint, p256dh, auth
  FROM push_subscriptions
`;

export const UPSERT_PUSH_SUBSCRIPTION_QUERY = `
  INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (endpoint)
  DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_id = EXCLUDED.user_id
`;

export const DELETE_PUSH_SUBSCRIPTION_QUERY = `
  DELETE FROM push_subscriptions
  WHERE id = $1
`;

export const DELETE_PUSH_SUBSCRIPTION_BY_ENDPOINT_QUERY = `
  DELETE FROM push_subscriptions
  WHERE endpoint = $1
`;
