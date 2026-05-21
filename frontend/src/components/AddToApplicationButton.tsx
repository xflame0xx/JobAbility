import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ApplicationGeneratedApi,
  getApiErrorMessage,
} from "../generated/jobabilityApi";
import { ROUTES } from "../routes";
import { useAppSelector } from "../store/hooks";

interface AddToApplicationButtonProps {
  vacancyId: number;
  className?: string;
}

export const AddToApplicationButton = ({
  vacancyId,
  className = "vacancy-add-btn",
}: AddToApplicationButtonProps) => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const canAdd = user?.role === "applicant";

  const handleClick = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!canAdd) {
      setMessage("Добавление в заявку доступно только соискателю.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await ApplicationGeneratedApi.applicationLineAdd(vacancyId);

      setMessage(`Добавлено в заявку №${response.application_id}`);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-to-application">
      <button
        type="button"
        className={className}
        disabled={loading || !canAdd}
        onClick={handleClick}
      >
        {loading ? "Добавление..." : "Добавить в заявку"}
      </button>

      {message && <div className="add-to-application__message">{message}</div>}
    </div>
  );
};
