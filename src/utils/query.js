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

// const getBoardQuery = `SELECT b.id AS 'boardId'
//                                    , b.title AS 'boardTitle'
//                                    , b.card_order AS 'cardOrder'
//                                    , b.project_id AS 'projectId'
//                                    , c.id AS 'cardId'
//                                    , c.title AS 'cardTitle'
//                                    , c.d_day AS 'dDay'
//                                    , c.status AS 'status'
//                                    , c.check AS 'check'
//                                    , c.created_at AS 'createdAt'
//                                    , l.id AS 'labelId'
//                                    , l.color AS 'labelColor'
//                               FROM boards AS b
//                                    LEFT OUTER JOIN cards AS c
//                                                 ON b.id=c.board_id
//                                    LEFT OUTER JOIN card_label AS cl
//                                                 ON cl.card_id=c.id
//                                    LEFT OUTER JOIN labels AS l
//                                                 ON cl.label_id=l.id
//                               WHERE b.project_id=?`;

const getBoardQuery = `SELECT CONCAT('B', b.id) AS 'boardId'
                            , b.title AS 'boardTitle'
                            , b.card_order AS 'cardOrder'
                            , b.project_id AS 'projectId'
                            , CONCAT('C', c.id) AS 'cardId'
                            , c.title AS 'cardTitle'
                            , c.d_day AS 'dDay'
                            , c.status AS 'status'
                            , c.check AS 'check'
                            , c.created_at AS 'createdAt'
                            , l.id AS 'labelId'
                            , l.color AS 'labelColor'
                            , t.task_count AS 'taskCount'
                            , t.task_check_count AS 'taskCheckCount'
                            , cm.comment_count AS 'commentCount'
                       FROM boards AS b
                            LEFT JOIN cards AS c
                                   ON b.id=c.board_id
                            LEFT JOIN card_label AS cl
                                   ON cl.card_id=c.id
                            LEFT JOIN labels AS l
                                   ON cl.label_id=l.id
                            LEFT JOIN (SELECT card_id
                                            , COUNT(*) AS 'task_count'
                                            , COUNT(CASE WHEN \`check\`=1 THEN 1 END) AS 'task_check_count'
                                       FROM tasks
                                       GROUP BY card_id) AS t
                                   ON t.card_id=c.id
                           LEFT JOIN (SELECT card_id
                                           , COUNT(*) AS 'comment_count'
                                      FROM comments
                                      GROUP BY card_id) AS cm
                                  ON cm.card_id=c.id
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

const getProjectMembers = `SELECT u.id AS \`id\`
                                , u.name AS \`name\`
                                , u.profile_image AS \`profileImage\`
                                , u.introduce AS 'introduce'
                                , (CASE WHEN p.\`owner\`=u.\`id\` THEN 1 ELSE 0 END) AS \`owner\`
                           FROM user_project AS up
                                INNER JOIN users AS u
                                        ON up.user_id=u.id
                                INNER JOIN projects AS p
                                        ON up.project_id=p.id
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
