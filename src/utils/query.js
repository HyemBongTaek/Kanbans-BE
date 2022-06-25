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
                            , l.id AS 'labelId'
                            , l.title AS 'labelTitle'
                            , l.color AS 'labelColor'
                       FROM boards AS b
                            LEFT OUTER JOIN cards AS c
                                         ON b.id=c.board_id
                            LEFT OUTER JOIN card_order AS co
                                         ON b.id=co.board_id
                            LEFT OUTER JOIN card_label AS cl
                                         ON cl.card_id=c.id
                            LEFT OUTER JOIN labels AS l
                                         ON cl.label_id=l.id
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

const getProjectMembers = `SELECT u.id AS 'id'
                                , u.name AS 'name'
                                , u.profile_image AS 'profileImage'
                           FROM user_project AS up
                                INNER JOIN users AS u
                                        ON up.user_id=u.id
                           WHERE project_id=?`;

const uninvitedMembersQuery = `SELECT u.id AS 'userId'
                                    , u.profile_image AS 'profileImage'
                                    , u.name AS 'name'
                               FROM user_project AS up
                                    INNER JOIN users AS u
                                            ON up.user_id=u.id
                               WHERE up.project_id=?
                               AND up.user_id NOT IN (SELECT user_id
                                                      FROM user_card
                                                      WHERE card_id=?)`;

module.exports = {
  loadProjectsQuery,
  findProjectsQuery,
  getBoardQuery,
  getCommentQuery,
  getProjectMembers,
  uninvitedMembersQuery,
};
