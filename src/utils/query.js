const loadProjectsQuery = `SELECT pj.title
                                , pj.permission
                                , pj.project_id AS projectId
                                , pj.bookmark
                                , u.id AS userId
                                , u.profile_image AS profileImage
                                , u.name
                           FROM (SELECT p.id AS 'project_id'
                                      , p.title AS 'title'
                                      , p.permission AS 'permission'
                                      , up.user_id AS 'user_id'
                                      , up.bookmark
                                 FROM user_project AS up
                                      INNER JOIN projects AS p
                                              ON up.project_id=p.id
                                 WHERE up.user_id=?) AS pj
                                INNER JOIN user_project AS up
                                        ON up.project_id=pj.project_id
                                INNER JOIN users AS u
                                        ON up.user_id=u.id
                           ORDER BY pj.bookmark DESC, pj.title ASC`;

const insertUserProjectQuery = `INSERT INTO user_project(user_id, project_id)
                                VALUES (?, ?)`;

const findProjectsQuery = `SELECT id 
                           FROM projects 
                           WHERE owner=?`;

module.exports = {
  loadProjectsQuery,
  insertUserProjectQuery,
  findProjectsQuery,
};
