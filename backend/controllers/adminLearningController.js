// MVP: Admin CRUD UI is deferred until core learning works.
// This controller is intentionally minimal to avoid breaking changes.

export const notImplemented = (req, res) => {
  return res.status(501).json({ message: 'Admin learning endpoints not implemented (MVP deferred).' });
};

