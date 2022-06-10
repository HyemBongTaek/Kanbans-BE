const loadProjectsQuery = `SELECT pj.title AS 'title'
                                , pj.permission AS 'permission'
                                , pj.project_id AS 'projectId'
                                , pj.bookmark AS 'bookmark'
                                , pj.owner AS 'owner'
                                , u.id AS 'userId'
                                , u.profile_image AS 'profileImage'
                                , u.name
                           FROM (SELECT p.id AS 'project_id'
                                      , p.title AS 'title'
                                      , p.permission AS 'permission'
                                      , p.owner AS 'owner'
                                      , up.user_id AS 'user_id'
                                      , up.bookmark AS 'bookmark'
                                 FROM user_project AS up
                                      INNER JOIN projects AS p
                                              ON up.project_id=p.id
                                 WHERE up.user_id=?) AS pj
                                INNER JOIN user_project AS up
                                        ON up.project_id=pj.project_id
                                INNER JOIN users AS u
                                        ON up.user_id=u.id
                           ORDER BY pj.bookmark DESC, pj.title ASC`;

const findProjectsQuery = `SELECT id 
                           FROM projects 
                           WHERE owner=?`;

const getBoardQuery = `SELECT b.id AS 'boardId'
                            , b.title AS 'boardTitle'
                            , b.project_id AS 'projectId'
                            , c.id AS 'cardId'
                            , c.title AS 'cardTitle'
                            , c.d_day AS 'dDay'
                            , c.status AS 'status'
                            , c.check AS 'check'
                            , c.created_at AS 'createdAt'
                            , co.order AS 'cardOrder'
                       FROM boards AS b
                            LEFT OUTER JOIN cards AS c
                                         ON b.id=c.board_id
                            LEFT OUTER JOIN card_order AS co
                                         ON b.id=co.board_id
                       WHERE b.project_id=?`;

const getCommentQuery = `SELECT c.id AS 'id',
                                c.content AS 'content',
                                c.created_at AS 'createdAt',
                                c.user_id AS 'userId',
                                c.card_id AS 'cardId',
                                u.profile_image AS 'profileImage',
                                u.name AS 'name'
                         FROM comments AS c
                              LEFT OUTER JOIN users AS u
                                   ON c.user_id = u.id
                         WHERE c.card_id=?`;

module.exports = {
  loadProjectsQuery,
  findProjectsQuery,
  getBoardQuery,
  getCommentQuery,
};
