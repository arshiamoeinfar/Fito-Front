
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError, toApiError } from "../../../api/client";
import { useSession } from "../../../api/session";
import { nowDateTimeValue } from "../../../lib/jalali";

import Analysis from "./Analysis";

const MAIN_FIELDS = [
  ["weight_kg", "وزن (کیلوگرم)"],
  ["height_cm", "قد (سانتی‌متر)"],
  ["waist_cm", "دور کمر (سانتی‌متر)"],
];

const EXTRA_FIELDS = [
  ["chest_cm", "دور سینه (سانتی‌متر)"],
  ["hip_cm", "دور باسن (سانتی‌متر)"],
  ["neck_cm", "دور گردن (سانتی‌متر)"],
  ["left_arm_cm", "دور بازوی چپ (سانتی‌متر)"],
  ["right_arm_cm", "دور بازوی راست (سانتی‌متر)"],
  ["left_thigh_cm", "دور ران چپ (سانتی‌متر)"],
  ["right_thigh_cm", "دور ران راست (سانتی‌متر)"],
  ["body_fat_percent", "چربی بدن (درصد)"],
];

const BODY_FIELDS = [...MAIN_FIELDS, ...EXTRA_FIELDS];

function emptyMetrics() {
  return Object.fromEntries(BODY_FIELDS.map(([key]) => [key, ""]));
}

export default function AnalysisToolsPage() {
  const navigate = useNavigate();
  const { account } = useSession();

  const name = account?.profiles?.athlete?.display_name || "ورزشکار";

  const [observations, setObservations] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [panel, setPanel] = useState("sizes");

  const [measuredAt, setMeasuredAt] = useState(nowDateTimeValue);
  const [metrics, setMetrics] = useState(emptyMetrics);

  const [share, setShare] = useState(false);
  const shareTouched = useRef(false);

  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [recordsKey, setRecordsKey] = useState(0);

  const [recordForm, setRecordForm] = useState({
    exercise_id: "",
    metric: "max_weight_g",
    value: "",
  });

  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [compare, setCompare] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [sets, setSets] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoClosed, setPhotoClosed] = useState("");

  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [sessions, setSessions] = useState([]);

  const previewUrls = useRef([]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const requests = [
        api("/api/v1/athlete/body-observations").then((body) => {
          if (!cancelled) setObservations(body.observations ?? []);
        }).catch((caught) => {
          if (!cancelled) setError(caught.message);
        }),

        api("/api/v1/athlete/relationships").then((body) => {
          if (cancelled) return;

          const activeRelationship = (body.relationships ?? []).find(
            (row) => row.status === "active"
          );

          setRelationshipId(
            activeRelationship ? String(activeRelationship.id) : ""
          );

          if (activeRelationship && !shareTouched.current) {
            setShare(true);
          }
        }).catch(() => {
          if (!cancelled) setRelationshipId("");
        }),

        api("/api/v1/athlete/body-photos").then((body) => {
          if (cancelled) return;
          setPhotos(body.photos ?? []);
          setSets(body.sets ?? []);
          setPhotoClosed("");
        }).catch((caught) => {
          if (cancelled) return;

          setPhotos([]);
          setSets([]);

          if (caught instanceof ApiError && caught.status === 403) {
            setPhotoClosed(caught.message);
            return;
          }

          setError(caught.message);
        }),

        api("/api/v1/athlete/workout-assignments").then((body) => {
          if (!cancelled) setWorkouts(body.assignments ?? []);
        }).catch(() => {
          if (!cancelled) setWorkouts([]);
        }),

        api("/api/v1/athlete/meal-assignments").then((body) => {
          if (!cancelled) setMeals(body.assignments ?? []);
        }).catch(() => {
          if (!cancelled) setMeals([]);
        }),
      ];

      await Promise.all(requests);
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const created = [];

    async function loadPreviews() {
      const rows = await Promise.all(
        photos.map(async (photo) => {
          try {
            const response = await fetch(
              `/api/v1/athlete/body-photos/${photo.id}/file`,
              { credentials: "include" }
            );

            if (!response.ok) return null;

            const url = URL.createObjectURL(await response.blob());
            created.push(url);

            return { id: photo.id, url };
          } catch {
            return null;
          }
        })
      );

      if (cancelled) {
        created.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = created;

      setPreviews(rows.filter(Boolean));
    }

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [photos]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = [];
    };
  }, []);

  useEffect(() => {
    if (!relationshipId) {
      setRecords([]);
      setExercises([]);
      return undefined;
    }

    let active = true;

    api(
      `/api/v1/athlete/records?coaching_relationship_id=${relationshipId}`
    ).then(
      (body) => {
        if (!active) return;
        setRecords(body.records ?? []);
        setExercises(body.exercises ?? []);
      },
      (caught) => {
        if (active) setError(caught.message);
      }
    );

    return () => {
      active = false;
    };
  }, [relationshipId, recordsKey]);

  useEffect(() => {
    if (!beforeId || !afterId || beforeId === afterId) {
      setCompare(null);
      return undefined;
    }

    let cancelled = false;

    api(
      `/api/v1/athlete/body-observations/compare?before_id=${beforeId}&after_id=${afterId}`
    ).then(
      (body) => {
        if (!cancelled) setCompare(body);
      },
      (caught) => {
        if (!cancelled) setError(caught.message);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [beforeId, afterId]);

  useEffect(() => {
    if (panel !== "report") return undefined;

    let active = true;

    api("/api/v1/athlete/workout-sessions").then(
      (body) => {
        if (active) setSessions(body.sessions ?? []);
      },
      () => {
        if (active) setSessions([]);
      }
    );

    return () => {
      active = false;
    };
  }, [panel]);

  function latestOf(key) {
    const found = observations.find((item) => {
      const value = item.metrics?.[key];
      return value !== null && value !== undefined && value !== "";
    });

    return found?.metrics?.[key];
  }

  async function saveObservation(event) {
    event.preventDefault();

    const payloadMetrics = {};

    BODY_FIELDS.forEach(([key]) => {
      if (metrics[key] !== "") {
        payloadMetrics[key] = metrics[key];
      }
    });

    const measured =
      measuredAt.length === 16 ? `${measuredAt}:00` : measuredAt;

    const payload = {
      measured_at: measured,
      source: "manual",
      metrics: payloadMetrics,
    };

    if (share && relationshipId) {
      payload.visibility = "relationship";
      payload.coaching_relationship_id = Number(relationshipId);
    }

    setPending(true);
    setError("");
    setNotice("");

    try {
      await api("/api/v1/athlete/body-observations", {
        method: "POST",
        body: payload,
      });

      const body = await api("/api/v1/athlete/body-observations");

      setObservations(body.observations ?? []);
      setMetrics(emptyMetrics());
      setNotice("مشاهده بدن ثبت شد.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPending(false);
    }
  }

  async function uploadPhoto({ takenAt, note, items }) {
    if (!relationshipId || items.length === 0) return;

    const form = new FormData();

    const taken = takenAt.length === 16 ? `${takenAt}:00` : takenAt;

    items.forEach((item) => {
      form.append("photos[]", item.file);
      form.append("views[]", item.view);
      form.append("captions[]", item.caption);
    });

    form.append("note", note);
    form.append("taken_at", taken);
    form.append("coaching_relationship_id", relationshipId);

    setPending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/v1/athlete/body-photos", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        body: form,
      });

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : null;

      if (!response.ok) {
        throw toApiError(response.status, payload);
      }

      const body = await api("/api/v1/athlete/body-photos");

      setPhotos(body.photos ?? []);
      setSets(body.sets ?? []);
      setNotice("مجموعه عکس ثبت شد.");
    } catch (caught) {
      setError(caught.message);
      throw caught;
    } finally {
      setPending(false);
    }
  }

  async function saveRecord(event) {
    event.preventDefault();

    if (!relationshipId) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await api("/api/v1/athlete/records", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(relationshipId),
          exercise_id: Number(recordForm.exercise_id),
          metric: recordForm.metric,
          value: Number(recordForm.value),
        },
      });

      setRecordForm((current) => ({ ...current, value: "" }));
      setRecordsKey((key) => key + 1);
      setNotice("رکورد ثبت شد. مربی و دستیارش آن را می‌بینند.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPending(false);
    }
  }

  const weightNow = latestOf("weight_kg");
  const waistNow = latestOf("waist_cm");
const previewMap = Object.fromEntries(
  (previews ?? []).map((photo) => [photo.id, photo.url])
);
  const active = Boolean(relationshipId);

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>

        <main className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard
              title="ثبت و گزارش"
              description="ثبت اندازه‌ها، عکس‌ها و رکوردهای ورزشی"
              btnTrue
              actionLabel="بازگشت به تحلیل"
              onAction={() => navigate("/AnalysisPage")}
            />

            <Analysis
              name={name}
              weightNow={weightNow}
              waistNow={waistNow}
              photos={photos}
              records={records}
              error={error}
              notice={notice}
              panel={panel}
              setPanel={setPanel}
              saveObservation={saveObservation}
              measuredAt={measuredAt}
              setMeasuredAt={setMeasuredAt}
              metrics={metrics}
              setMetrics={setMetrics}
              share={share}
              setShare={setShare}
              shareTouched={shareTouched}
              active={active}
              pending={pending}
              observations={observations}
              previewMap={previewMap}
              photoClosed={photoClosed}
              sets={sets}
              uploadPhoto={uploadPhoto}
              recordForm={recordForm}
              setRecordForm={setRecordForm}
              exercises={exercises}
              saveRecord={saveRecord}
              beforeId={beforeId}
              setBeforeId={setBeforeId}
              afterId={afterId}
              setAfterId={setAfterId}
              compare={compare}
              workouts={workouts}
              meals={meals}
              sessions={sessions}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
