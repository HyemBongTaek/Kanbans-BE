const loadProjectsQuery = `SELECT project.title
                                , project.permission
                                , u.id
                                , project.project_id
                                , u.profile_image
                                , u.name
                           FROM (SELECT p.id AS 'project_id'
                                      , p.title AS 'title'
                                      , p.permission AS 'permission'
                                      , up.user_id AS 'user_id'
                                 FROM user_project AS up
                                      INNER JOIN projects AS p
                                              ON up.project_id=p.id
                                 WHERE up.user_id=?) AS project
                                INNER JOIN user_project AS up
                                        ON up.project_id=project.project_id
                                INNER JOIN users AS u
                                        ON up.user_id=u.id
                           ORDER BY project.title DESC`;

const createBookmarkQuery = `INSERT INTO bookmarks(user_id, project_id)
                             VALUES(?, ?)`;

const insertUserProjectQuery = `INSERT INTO user_project(user_id, project_id)
                                VALUES (?, ?)`;

module.exports = {
  loadProjectsQuery,
  createBookmarkQuery,
  insertUserProjectQuery,
};
