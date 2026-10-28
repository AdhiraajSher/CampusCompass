import {
  calculateCC,
  factors,
  type CheckIn,
  type CCResult,
} from "./cc-score.ts";
import type { Identity } from "./domain.ts";
import { sortTasks, type StaffTask, type TaskStatus } from "./task-types.ts";

export class AccessError extends Error {
  status = 403;
}
export type SupportRequest = {
  id: string;
  studentId: string;
  studentName: string;
  privateRequest: boolean;
  urgency: "soon" | "routine";
  category: string;
  requestedAt: string;
  status: TaskStatus | "Cancelled";
  assignedTo: string | null;
};
export type StudentView = {
  checkIn: CheckIn | null;
  result: CCResult | null;
  requests: SupportRequest[];
};
const isStaff = (identity: Identity) =>
  identity.role === "teacher" || identity.role === "manager";
function studentId(identity: Identity) {
  if (identity.role !== "student" || !identity.studentId)
    throw new AccessError("Student access required.");
  return identity.studentId;
}

export function validateStudentCheckIn(body: unknown): CheckIn {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Invalid check-in.");
  const input = body as Record<string, unknown>;
  if (input.consent !== true || typeof input.shareSummary !== "boolean")
    throw new Error(
      "Confirm voluntary saving and choose a summary-sharing preference.",
    );
  if (
    !input.values ||
    typeof input.values !== "object" ||
    Array.isArray(input.values)
  )
    throw new Error("Six quiz response fields are required.");
  const raw = input.values as Record<string, unknown>;
  if (factors.some((factor) => !(factor.key in raw)))
    throw new Error("Each area must have an answer or an explicit skip.");
  const values = Object.fromEntries(
    factors.map((factor) => [factor.key, raw[factor.key]]),
  ) as CheckIn["values"];
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const checkIn: CheckIn = {
    id: crypto.randomUUID(),
    date: today,
    consent: true,
    shareSummary: input.shareSummary,
    values,
    contextTags: [],
  };
  calculateCC(checkIn); // Runtime validation rejects non-integers, strings and out-of-range ratings.
  return checkIn;
}

/** Process-local demo state. Raw answers have no staff projection or public endpoint. */
export class PortalStore {
  private checkIns = new Map<string, CheckIn>();
  private requests = new Map<string, SupportRequest>();
  private changes = new Map<
    string,
    Partial<Pick<StaffTask, "status" | "assignedTo" | "owner">>
  >();

  studentView(identity: Identity): StudentView {
    const id = studentId(identity),
      checkIn = this.checkIns.get(id) ?? null;
    return structuredClone({
      checkIn,
      result: checkIn ? calculateCC(checkIn) : null,
      requests: [...this.requests.values()]
        .filter((request) => request.studentId === id)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    });
  }
  saveCheckIn(identity: Identity, checkIn: CheckIn): StudentView {
    const id = studentId(identity);
    if (!checkIn.consent) throw new Error("Consent is required to save.");
    calculateCC(checkIn);
    this.checkIns.set(id, structuredClone(checkIn));
    return this.studentView(identity);
  }
  deleteCheckIn(identity: Identity): StudentView {
    this.checkIns.delete(studentId(identity));
    return this.studentView(identity);
  }

  requestSupport(
    identity: Identity,
    input: {
      privateRequest: boolean;
      urgency: "soon" | "routine";
      category: string;
    },
  ): StudentView {
    const id = studentId(identity);
    if (!input || typeof input !== "object")
      throw new Error("Invalid support request.");
    if (
      typeof input.privateRequest !== "boolean" ||
      !["soon", "routine"].includes(input.urgency)
    )
      throw new Error("Choose privacy and contact timing.");
    if (
      ![
        "Learning support",
        "Attendance",
        "Study planning",
        "Private conversation",
      ].includes(input.category)
    )
      throw new Error("Choose a supported request category.");
    const current = [...this.requests.values()].find(
      (request) =>
        request.studentId === id &&
        ["Open", "In progress"].includes(request.status),
    );
    const request: SupportRequest = {
      id: current?.id ?? crypto.randomUUID(),
      studentId: id,
      studentName: identity.name,
      privateRequest: input.privateRequest,
      urgency: input.urgency,
      category: input.privateRequest ? "Private conversation" : input.category,
      requestedAt: current?.requestedAt ?? new Date().toISOString(),
      status: current?.status ?? "Open",
      assignedTo: current?.assignedTo ?? null,
    };
    this.requests.set(request.id, request);
    return this.studentView(identity);
  }
  cancelRequest(identity: Identity, requestId: string): StudentView {
    const id = studentId(identity),
      request = this.requests.get(requestId);
    if (!request || request.studentId !== id)
      throw new AccessError("Request not accessible.");
    this.requests.set(requestId, { ...request, status: "Cancelled" });
    return this.studentView(identity);
  }
  tasks(identity: Identity, academic: StaffTask[]): StaffTask[] {
    if (!isStaff(identity))
      throw new AccessError("Teacher or batch-manager access required.");
    const requests: StaffTask[] = [...this.requests.values()]
      .filter((request) => request.status !== "Cancelled")
      .map((request) => {
        const saved = this.checkIns.get(request.studentId);
        const score =
          saved?.shareSummary && !request.privateRequest
            ? calculateCC(saved)
            : null;
        return {
          id: `request-${request.id}`,
          kind: "support-request",
          studentId: request.studentId,
          studentName: request.studentName,
          title: request.privateRequest
            ? "Coordinate a private support conversation"
            : `Respond to a ${request.category.toLowerCase()} request`,
          action: request.privateRequest
            ? "Contact the student privately and agree on the next step. Do not request quiz answers as a condition of help."
            : "Contact the student about their chosen support topic.",
          reasons: [
            request.urgency === "soon"
              ? "Student asked to be contacted soon"
              : "Student requested a routine check-in",
            request.privateRequest
              ? "Private request: answers and CC Score are withheld"
              : request.category,
          ],
          priority: request.urgency === "soon" ? "P1" : "P2",
          due: new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: "Asia/Kolkata",
          }).format(new Date(request.requestedAt)),
          owner: "Batch Manager",
          assignedTo: request.assignedTo,
          status: request.status as TaskStatus,
          privateRequest: request.privateRequest,
          urgency: request.urgency,
          requestedAt: request.requestedAt,
          ...(score?.score != null
            ? { ccSummary: { score: score.score, coverage: score.coverage } }
            : {}),
        };
      });
    return structuredClone(
      sortTasks(
        [...requests, ...academic].map((task) => ({
          ...task,
          ...this.changes.get(task.id),
        })),
      ),
    );
  }
  updateTask(
    identity: Identity,
    id: string,
    patch: {
      status?: TaskStatus;
      assignToMe?: boolean;
      owner?: StaffTask["owner"];
    },
    academic: StaffTask[],
  ): StaffTask {
    const current = this.tasks(identity, academic).find(
      (task) => task.id === id,
    );
    if (!current) throw new Error("Task not found.");
    if (
      patch.status !== undefined &&
      !["Open", "In progress", "Done"].includes(patch.status)
    )
      throw new Error("Invalid task state.");
    if (
      patch.owner !== undefined &&
      (!isStaff(identity) ||
        identity.role !== "manager" ||
        !["Teacher / Instructor", "Batch Manager"].includes(patch.owner))
    )
      throw new AccessError(
        "Batch-manager access required to change the owner role.",
      );
    const update = {
      ...this.changes.get(id),
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.assignToMe ? { assignedTo: identity.name } : {}),
      ...(patch.owner ? { owner: patch.owner, assignedTo: null } : {}),
    };
    this.changes.set(id, update);
    if (current.kind === "support-request") {
      const requestId = id.replace(/^request-/, ""),
        request = this.requests.get(requestId)!;
      this.requests.set(requestId, {
        ...request,
        status: update.status ?? request.status,
        assignedTo:
          update.assignedTo === undefined
            ? request.assignedTo
            : update.assignedTo,
      });
    }
    return this.tasks(identity, academic).find((task) => task.id === id)!;
  }
}
const serverState = globalThis as typeof globalThis & {
  __ccPortal?: PortalStore;
};
export const portalStore = (serverState.__ccPortal ??= new PortalStore());
