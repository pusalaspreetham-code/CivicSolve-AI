import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { comparePassword, hashPassword } from "../utils/password";
import { VALID_DEPARTMENTS, VALID_DESIGNATIONS, VALID_ACTION_TYPES } from "../types/government";
import { aiPipelineClient } from "../services/aiPipelineClient";

// GET /api/gov/me
export const getGovMe = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, name, email, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at
     FROM government_users WHERE id = $1`,
    [req.govId]
  );

  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  return res.json({ success: true, user: rows[0] });
});

// PUT /api/gov/me
export const updateGovMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, designation, jurisdiction_city, jurisdiction_state, phone } = req.body;

  if (designation && !VALID_DESIGNATIONS.includes(designation)) {
    throw new AppError("Invalid designation selected.", 400);
  }

  const { rows } = await query(
    `UPDATE government_users
     SET name = COALESCE(NULLIF($1, ''), name),
         designation = COALESCE(NULLIF($2, ''), designation),
         jurisdiction_city = COALESCE(NULLIF($3, ''), jurisdiction_city),
         jurisdiction_state = COALESCE(NULLIF($4, ''), jurisdiction_state),
         phone = COALESCE(NULLIF($5, ''), phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, name, email, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at`,
    [name, designation, jurisdiction_city, jurisdiction_state, phone, req.govId]
  );

  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  return res.json({ success: true, user: rows[0] });
});

// PUT /api/gov/change-password
export const changeGovPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError("All password fields are required.", 400);
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError("New passwords do not match.", 400);
  }

  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long.", 400);
  }

  const { rows } = await query(`SELECT password_hash FROM government_users WHERE id = $1`, [req.govId]);
  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  const isMatch = await comparePassword(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 401);
  }

  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE government_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newHash, req.govId]
  );

  return res.json({ success: true, message: "Password updated successfully." });
});

const getDepartmentDomains = (department: string): string[] => {
  switch (department) {
    case 'Public Works': return ['Road Infrastructure', 'Public Facilities', 'Housing'];
    case 'Water Supply': return ['Water Supply', 'Water Quality'];
    case 'Sanitation': return ['Sanitation', 'Waste Management'];
    case 'Transportation': return ['Public Transport', 'Traffic Management'];
    case 'Urban Planning': return ['Housing', 'Public Facilities'];
    case 'Health': return ['Healthcare'];
    case 'Education': return ['Education'];
    case 'Environment': return ['Environment', 'Pollution'];
    case 'Energy & Power': return ['Energy', 'Public Lighting'];
    default: return [department];
  }
};

// GET /api/gov/dashboard/stats
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  
  const department = userRows[0].department;
  const domains = getDepartmentDomains(department);
  
  const totalProblemsQuery = await query(`SELECT COUNT(*) as count FROM reports WHERE domain = ANY($1)`, [domains]);
  const highPriorityQuery = await query(`SELECT COUNT(*) as count FROM reports WHERE domain = ANY($1) AND severity IN ('Critical', 'High')`, [domains]);
  const actionsTakenQuery = await query(`SELECT COUNT(*) as count FROM government_actions WHERE gov_user_id = $1`, [req.govId]);
  const problemsResolvedQuery = await query(`SELECT COUNT(*) as count FROM government_actions WHERE gov_user_id = $1 AND action_type = 'RESOLVED'`, [req.govId]);

  return res.json({
    success: true,
    stats: {
      total_problems: parseInt(totalProblemsQuery.rows[0].count),
      high_priority: parseInt(highPriorityQuery.rows[0].count),
      actions_taken: parseInt(actionsTakenQuery.rows[0].count),
      problems_resolved: parseInt(problemsResolvedQuery.rows[0].count),
    }
  });
});

// GET /api/gov/problems
export const getGovProblems = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  
  const department = userRows[0].department;
  const domains = getDepartmentDomains(department);

  const { severity, domain, actionStatus } = req.query;
  
  let q = `
    SELECT r.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', ga.id, 'action_type', ga.action_type, 'created_at', ga.created_at) ORDER BY ga.created_at DESC)
         FROM government_actions ga WHERE ga.problem_id = r.id),
        '[]'
      ) as actions
    FROM reports r
    WHERE r.domain = ANY($1)
  `;
  const params: any[] = [domains];
  let paramIdx = 2;

  if (severity) {
    q += ` AND r.severity = $${paramIdx++}`;
    params.push(severity);
  }
  
  if (domain) {
    q += ` AND r.domain = $${paramIdx++}`;
    params.push(domain);
  }

  // Simplified filtering by actionStatus for example
  
  q += ` ORDER BY 
         CASE r.severity 
           WHEN 'Critical' THEN 1 
           WHEN 'High' THEN 2 
           WHEN 'Medium' THEN 3 
           WHEN 'Low' THEN 4 
           ELSE 5 
         END ASC, r.created_at DESC`;

  const { rows } = await query(q, params);
  return res.json({ success: true, problems: rows });
});

// GET /api/gov/problems/:id
export const getGovProblemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { rows } = await query(`
    SELECT r.*, 
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', ga.id, 
          'action_type', ga.action_type, 
          'remarks', ga.remarks,
          'budget_estimate', ga.budget_estimate,
          'timeline_days', ga.timeline_days,
          'created_at', ga.created_at,
          'official_name', gu.name,
          'official_designation', gu.designation
         ) ORDER BY ga.created_at DESC)
         FROM government_actions ga
         JOIN government_users gu ON ga.gov_user_id = gu.id
         WHERE ga.problem_id = r.id),
        '[]'
      ) as actions
    FROM reports r
    WHERE r.id = $1
  `, [id]);
  
  if (rows.length === 0) {
    throw new AppError("Problem not found", 404);
  }
  
  return res.json({ success: true, problem: rows[0] });
});

// POST /api/gov/problems/:id/action
export const createGovAction = asyncHandler(async (req: Request, res: Response) => {
  const { id: problem_id } = req.params;
  const { action_type, remarks, budget_estimate, timeline_days } = req.body;
  
  if (!VALID_ACTION_TYPES.includes(action_type)) {
    throw new AppError("Invalid action type", 400);
  }
  
  if (!remarks || remarks.trim().length < 10) {
    throw new AppError("Remarks must be at least 10 characters", 400);
  }

  const { rows } = await query(`
    INSERT INTO government_actions (gov_user_id, problem_id, action_type, remarks, budget_estimate, timeline_days)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.govId, problem_id, action_type, remarks, budget_estimate || null, timeline_days || null]);

  return res.json({ success: true, action: rows[0] });
});

// GET /api/gov/problems/:id/actions
export const getGovProblemActions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { rows } = await query(`
    SELECT ga.*, gu.name as official_name, gu.designation as official_designation, gu.department as official_department
    FROM government_actions ga
    JOIN government_users gu ON ga.gov_user_id = gu.id
    WHERE ga.problem_id = $1
    ORDER BY ga.created_at DESC
  `, [id]);
  
  return res.json({ success: true, actions: rows });
});

// GET /api/gov/problems/:id/ai-brief
export const getAiBrief = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { rows } = await query(`SELECT * FROM reports WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw new AppError("Problem not found", 404);
  }
  
  const problem = rows[0];
  
  try {
    const brief = await aiPipelineClient.getExecutiveBrief({
      problem_title: problem.problem_title || 'Unknown Title',
      problem_description: problem.problem_description || problem.description_original || '',
      domain: problem.domain,
      severity: problem.severity,
      report_count: problem.report_count,
      location_count: problem.location_count || 1,
      responsible_fields: problem.responsible_fields || []
    });
    
    return res.json({ success: true, brief });
  } catch (error) {
    console.error("AI Brief error:", error);
    // Graceful fallback
    return res.json({ 
      success: true, 
      brief: {
        impact_assessment: "AI Service temporarily unavailable. Manual assessment required.",
        recommended_actions: ["Investigate the reported issue", "Coordinate with local teams", "Allocate necessary budget"],
        resource_estimate: "Pending manual evaluation",
        priority_score: problem.severity === 'Critical' ? 90 : problem.severity === 'High' ? 75 : 50
      } 
    });
  }
});
