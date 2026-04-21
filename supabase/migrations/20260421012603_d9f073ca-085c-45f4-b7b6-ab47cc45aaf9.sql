DELETE FROM legislation_history
WHERE legislation_id NOT IN (SELECT id FROM legislations);