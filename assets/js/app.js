const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const stageInfo = {
      1: ["Misión 1 · Radar del grupo", "Detectá las barreras", "Conocé al grupo y observá qué aspectos del contexto pueden limitar su participación."],
      2: ["Misión 2 · Abrir el acceso", "Quitá las barreras de entrada", "Elegí cambios concretos para que todo el grupo pueda acceder al mismo contenido."],
      3: ["Misión 3 · Detectives del pensamiento", "¿Procesar o solo repetir?", "Clasificá situaciones y reconocé cuáles ayudan a elaborar el conocimiento."],
      4: ["Misión 4 · Expresar y aprender", "El conocimiento necesita distintas salidas", "Resolvé tres pasos: formas de expresión, feedback y autorregulación."],
      5: ["Misión final · Tu mini Canvas", "Reflexioná y llevá una idea al aula", "Convertí las decisiones del juego en una mejora concreta para tu práctica."]
    };

    let currentStage = 1;
    let activeProfile = null;
    const matchedProfiles = new Set();
    const correctDimensions = ["sensorial", "cognitiva", "emocional", "fisica"];
    const selectedAccess = new Set();
    const processClassifications = new Map();
    const selectedFormats = new Set();
    let selectedFeedback = "";
    let selectedReg = "";
    let elapsedSeconds = 0;
    let timerId = null;
    let completed = { detect: false, access: false, process: false, express: false };

    const clock = $("#clock");

    function formatTime(seconds) {
      const min = String(Math.floor(seconds / 60)).padStart(2, "0");
      const sec = String(seconds % 60).padStart(2, "0");
      return `${min}:${sec}`;
    }

    function updateClock() {
      clock.textContent = formatTime(elapsedSeconds);
    }

    function startTimer() {
      if (timerId) return;
      timerId = setInterval(() => {
        elapsedSeconds += 1;
        updateClock();
      }, 1000);
    }

    function stopTimer() {
      if (timerId) clearInterval(timerId);
      timerId = null;
    }

    function showStage(stage) {
      currentStage = stage;
      $$(".stage-panel").forEach(panel => panel.classList.remove("active"));
      $(`#stage${stage}`).classList.add("active");
      $("#stageEyebrow").textContent = stageInfo[stage][0];
      $("#stageTitle").textContent = stageInfo[stage][1];
      $("#stageDescription").textContent = stageInfo[stage][2];
      $("#stageCount").textContent = `${stage} de 5`;
      $("#progressText").textContent = `${stage * 20}% completado`;
      $("#progressFill").style.width = `${stage * 20}%`;
      $$("#stepList .step-item").forEach((item, index) => {
        item.classList.toggle("active", index + 1 === stage);
        item.classList.toggle("done", index + 1 < stage);
      });
      $("#game").scrollIntoView({ behavior: "smooth", block: "start" });
      $("#stageTitle").focus?.({ preventScroll: true });
      if (stage === 5) {
        stopTimer();
        $("#finalKeys").textContent = `${Object.values(completed).filter(Boolean).length}/4`;
        $("#elapsedFinal").textContent = `Tiempo de recorrido: ${formatTime(elapsedSeconds)}`;
      }
    }

    $("#startBtn").addEventListener("click", async () => {
      const email = $("#startEmail").value.trim().toLowerCase();
      const button = $("#startBtn");
      const feedback = $("#startEmailFeedback");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        feedback.className = "feedback-box error";
        feedback.textContent = "Ingresá un correo electrónico válido para comprobar tu participación.";
        $("#startEmail").focus();
        return;
      }

      button.disabled = true;
      button.textContent = "Comprobando correo...";
      feedback.className = "feedback-box";
      feedback.textContent = "Estamos comprobando si esta dirección ya completó la actividad.";
      const requestId = `check-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "checkEmail", email, requestId })
        });
        const status = await verifySheetSubmission(requestId);
        if (status === "available") {
          $("#participantEmail").value = email;
          $("#intro").classList.remove("active");
          $("#game").classList.add("active");
          feedback.className = "feedback-box success";
          feedback.textContent = "Correo validado. ¡Ya podés comenzar!";
          startTimer();
          showStage(1);
        } else if (status === "duplicate") {
          feedback.className = "feedback-box error";
          feedback.textContent = "Este correo ya completó la actividad. La participación es única por dirección de correo electrónico.";
          button.disabled = false;
          button.textContent = "Comprobar otro correo";
        } else {
          feedback.className = "feedback-box error";
          feedback.textContent = "No pudimos confirmar el correo. Revisá tu conexión e intentá nuevamente.";
          button.disabled = false;
          button.textContent = "Volver a comprobar";
        }
      } catch (error) {
        feedback.className = "feedback-box error";
        feedback.textContent = "No pudimos conectar con el registro. Revisá tu conexión e intentá nuevamente.";
        button.disabled = false;
        button.textContent = "Reintentar";
      }
    });


    // Misión 1: primero se elige el perfil y debajo se identifica la barrera.
    $$("#profileGrid [data-profile]").forEach(card => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.profile);
        if (matchedProfiles.has(id)) return;
        activeProfile = id;
        $$("#profileGrid .profile-card").forEach(c => {
          c.classList.toggle("selected", Number(c.dataset.profile) === id);
          c.setAttribute("aria-pressed", String(Number(c.dataset.profile) === id));
        });
        $("#matchFeedback").className = "feedback-box";
        $("#matchFeedback").textContent = `Seleccionaste a ${card.querySelector("strong").textContent}. Ahora bajá a las cuatro dimensiones y elegí la barrera que aparece en esta situación.`;
      });
    });

    $$(".dimension-btn").forEach(button => {
      button.addEventListener("click", () => {
        if (activeProfile === null) {
          $("#matchFeedback").className = "feedback-box error";
          $("#matchFeedback").textContent = "Primero elegí uno de los cuatro perfiles. Después seleccioná la barrera debajo.";
          return;
        }
        const chosen = button.dataset.dimension;
        if (chosen === correctDimensions[activeProfile]) {
          matchedProfiles.add(activeProfile);
          const card = $(`[data-profile="${activeProfile}"]`);
          card.classList.remove("selected");
          card.classList.add("matched");
          card.setAttribute("aria-pressed", "true");
          $(`#status${activeProfile}`).textContent = "Identificada ✓";
          const names = ["Emi", "Tomi", "Alma", "Bruno"];
          const explanations = [
            "Sensorial: el texto pequeño y la única vía escrita dificultan percibir la información. Ampliar el texto y sumar una explicación oral abre otras vías de acceso.",
            "Cognitiva: muchos pasos juntos y sin una guía dificultan comprender y organizar la tarea. Una secuencia clara puede reducir esa barrera.",
            "Emocional: el temor a equivocarse frente a todos afecta la seguridad para participar. Un entorno cuidado y opciones graduales pueden favorecer su implicación.",
            "Física: el estante alto y el poco espacio dificultan llegar y manipular materiales. Reorganizar el aula permite un uso más autónomo."
          ];
          $("#matchFeedback").className = "feedback-box success";
          $("#matchFeedback").textContent = `${names[activeProfile]} · ${explanations[activeProfile]}`;
          activeProfile = null;
          $("#matchCounter").textContent = `${matchedProfiles.size} de 4 identificadas`;
          if (matchedProfiles.size === 4) {
            completed.detect = true;
            $("#matchFeedback").textContent += " Radar completo: reconociste barreras en el contexto y no etiquetas en las personas.";
            $("#next1").disabled = false;
          }
        } else {
          $("#matchFeedback").className = "feedback-box error";
          const hints = {
            sensorial: "Sensorial: observá si la información se percibe con claridad.",
            cognitiva: "Cognitiva: observá si la consigna se comprende y se puede organizar.",
            emocional: "Emocional: observá si la persona se siente segura para participar.",
            fisica: "Física: observá si puede llegar, desplazarse y manipular."
          };
          $("#matchFeedback").textContent = `Todavía no. ${hints[correctDimensions[activeProfile]]} Podés volver a intentarlo.`;
        }
      });
    });

    $("#next1").addEventListener("click", () => showStage(2));

    // Selección múltiple reutilizable.
    function setupMultiSelect(selector, set, counterSelector) {
      $$(selector).forEach(button => {
        button.addEventListener("click", () => {
          const key = button.dataset.access || button.dataset.expression;
          if (set.has(key)) {
            set.delete(key);
            button.classList.remove("selected");
            button.setAttribute("aria-pressed", "false");
          } else {
            set.add(key);
            button.classList.add("selected");
            button.setAttribute("aria-pressed", "true");
          }
          if (counterSelector) $(counterSelector).textContent = `${set.size} seleccionadas`;
        });
      });
    }
    setupMultiSelect("#accessGrid [data-access]", selectedAccess, "#accessCounter");
    setupMultiSelect("#formatGrid [data-expression]", selectedFormats, null);

    function checkAccessChoices() {
      const feedback = $("#accessFeedback");
      const selected = $$("#accessGrid [data-access]").filter(button => selectedAccess.has(button.dataset.access));
      if (selected.length < 3) {
        feedback.className = "feedback-box error";
        feedback.textContent = "Elegí al menos tres propuestas. Pensá en las barreras que identificaste en Emi, Tomi, Alma y Bruno.";
        return false;
      }
      const hasBarrier = selected.some(button => button.dataset.correct === "false");
      if (hasBarrier) {
        feedback.className = "feedback-box error";
        feedback.textContent = "Hay una propuesta que mantiene o agrega una barrera. Desmarcala y revisá las cuatro soluciones vinculadas con los perfiles.";
        return false;
      }
      feedback.className = "feedback-box success";
      feedback.textContent = "¡Bien! Elegiste cambios que amplían el acceso a la información y al entorno sin modificar la meta de aprendizaje.";
      completed.access = true;
      $$("#accessGrid [data-access]").forEach(button => button.disabled = true);
      $("#check2").hidden = true;
      $("#next2").hidden = false;
      return true;
    }

    $("#check2").addEventListener("click", checkAccessChoices);
    $("#next2").addEventListener("click", () => showStage(3));

    // Misión 3: clasificar situaciones, en lugar de volver a seleccionar apoyos.
    $$("#processGrid [data-process-card]").forEach(card => {
      const cardId = card.dataset.processCard;
      $$("[data-process-choice]", card).forEach(button => {
        button.addEventListener("click", () => {
          const choice = button.dataset.processChoice;
          processClassifications.set(cardId, choice);
          $$("[data-process-choice]", card).forEach(option => {
            option.classList.toggle("selected", option === button);
            option.setAttribute("aria-pressed", String(option === button));
          });
          const status = $("[data-process-status]", card);
          status.textContent = choice === "procesa" ? "Clasificada: ayuda a pensar" : "Clasificada: solo repite";
          status.style.color = choice === "procesa" ? "#147e75" : "#b45446";
          $("#processCounter").textContent = `${processClassifications.size} de 4 clasificadas`;
          $("#processFeedback").className = "feedback-box";
          $("#processFeedback").textContent = "Seguí con las otras tarjetas. Cuando las cuatro tengan una etiqueta, comprobá tu clasificación.";
        });
      });
    });

    $("#check3").addEventListener("click", () => {
      const feedback = $("#processFeedback");
      if (processClassifications.size < 4) {
        feedback.className = "feedback-box error";
        feedback.textContent = `Te faltan ${4 - processClassifications.size} tarjetas. Clasificá las cuatro situaciones antes de comprobar.`;
        return;
      }
      const cards = $$("#processGrid [data-process-card]");
      const wrong = cards.filter(card => processClassifications.get(card.dataset.processCard) !== card.dataset.answer);
      if (wrong.length) {
        feedback.className = "feedback-box error";
        feedback.textContent = "Algunas decisiones necesitan revisión. Preguntate si la situación exige comparar, relacionar, organizar o justificar, o si solamente pide repetir información. Podés cambiar las etiquetas.";
        return;
      }
      completed.process = true;
      feedback.className = "feedback-box success";
      feedback.textContent = "¡Clasificación correcta! Reconociste que procesar implica elaborar la información: relacionar, comparar, organizar, justificar y construir explicaciones.";
      $$("#processGrid [data-process-choice]").forEach(button => button.disabled = true);
      $("#check3").hidden = true;
      $("#next3").hidden = false;
    });
    $("#next3").addEventListener("click", () => showStage(4));

    // Misión 4: se divide en tres pantallas consecutivas.
    function showExpressionStep(step) {
      $$(".expression-step").forEach(panel => panel.classList.remove("active"));
      $(`#expressionStep${step}`).classList.add("active");
      $("#expressionStepLabel").textContent = `Paso ${step} de 3`;
      $("#expressionProgressFill").style.width = `${step * 33.333}%`;
      $("#stage4").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    $$("#feedbackOptions [data-feedback]").forEach(button => {
      button.addEventListener("click", () => {
        selectedFeedback = button.dataset.feedback;
        $$("#feedbackOptions [data-feedback]").forEach(b => {
          b.classList.toggle("selected", b === button);
          b.setAttribute("aria-pressed", String(b === button));
        });
        $("#feedbackStepMessage").className = "feedback-box";
        $("#feedbackStepMessage").textContent = selectedFeedback === "process"
          ? "Buena elección: reconoce un avance y ofrece una pista concreta para continuar."
          : "Esta devolución no alcanza para orientar el siguiente paso. Buscá una respuesta que ayude a revisar el proceso.";
      });
    });

    $$("#regOptions [data-reg]").forEach(button => {
      button.addEventListener("click", () => {
        selectedReg = button.dataset.reg;
        $$("#regOptions [data-reg]").forEach(b => {
          b.classList.toggle("selected", b === button);
          b.setAttribute("aria-pressed", String(b === button));
        });
        $("#regFeedback").className = "feedback-box";
        $("#regFeedback").textContent = selectedReg === "yes"
          ? "Sí: invita a reconocer logros, apoyos y próximos pasos."
          : "Esta pregunta compara a los estudiantes, pero no ayuda a revisar el propio aprendizaje.";
      });
    });

    $("#next4a").addEventListener("click", () => {
      if (selectedFormats.size < 2) {
        $("#formatFeedback").className = "feedback-box error";
        $("#formatFeedback").textContent = "Elegí al menos dos formas de expresión antes de continuar.";
        return;
      }
      $("#formatFeedback").className = "feedback-box success";
      $("#formatFeedback").textContent = "¡Perfecto! El criterio se mantiene y el grupo cuenta con más de una forma de demostrar lo aprendido.";
      showExpressionStep(2);
    });

    $("#back4b").addEventListener("click", () => showExpressionStep(1));

    $("#next4b").addEventListener("click", () => {
      if (selectedFeedback !== "process") {
        $("#feedbackStepMessage").className = "feedback-box error";
        $("#feedbackStepMessage").textContent = "Elegí una devolución que reconozca lo que la estudiante ya logró y le ofrezca una pista para continuar.";
        return;
      }
      showExpressionStep(3);
    });

    $("#back4c").addEventListener("click", () => showExpressionStep(2));

    $("#check4").addEventListener("click", () => {
      if (selectedReg !== "yes") {
        $("#regFeedback").className = "feedback-box error";
        $("#regFeedback").textContent = "Elegí la pregunta que permite revisar el propio proceso y decidir el próximo paso.";
        return;
      }
      completed.express = true;
      $("#regFeedback").className = "feedback-box success";
      $("#regFeedback").textContent = "¡Muy bien! La pregunta ayuda a la estudiante a reconocer sus avances, los apoyos que le sirvieron y cómo continuar.";
      $("#expressionFeedback").className = "feedback-box success";
      $("#expressionFeedback").textContent = "¡Propuesta validada! Ofreciste diferentes modos de expresión, feedback para mejorar y una oportunidad de autorregulación.";
      $("#check4").hidden = true;
      $("#next4").hidden = false;
    });

    $("#next4").addEventListener("click", () => showStage(5));

    // Conexión con Google Sheets: URL de implementación configurada.
    const GOOGLE_APPS_SCRIPT_URL = window.AULA_CONFIG.appsScriptUrl;

    function setSubmitMessage(message, state = "") {
      const box = $("#submitFeedback");
      box.className = state ? `feedback-box ${state}` : "feedback-box";
      box.textContent = message;
    }

    function validateFinalAnswers() {
      const email = $("#participantEmail").value.trim().toLowerCase();
      const name = $("#participantName").value.trim().replace(/\s+/g, " ");
      const nameParts = name.split(" ").filter(Boolean);
      const barrier = $("#barrierSelect").value;
      const change = $("#changeInput").value.trim();
      const evidence = $("#evidenceInput").value.trim();
      const reflection = $("#reflectionInput").value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setSubmitMessage("Ingresá una dirección de correo electrónico válida. La usamos únicamente para comprobar si ya completaste la actividad.", "error");
        $("#participantEmail").focus();
        return null;
      }
      if (nameParts.length < 2) {
        setSubmitMessage("Escribí tu nombre y apellido para identificar tu reflexión.", "error");
        $("#participantName").focus();
        return null;
      }
      if (!barrier || !change || !evidence || !reflection) {
        setSubmitMessage("Completá las cuatro respuestas del mini Canvas antes de enviarlas.", "error");
        const firstMissing = !barrier ? $("#barrierSelect") :
          !change ? $("#changeInput") :
          !evidence ? $("#evidenceInput") : $("#reflectionInput");
        firstMissing.focus();
        return null;
      }
      if ([change, evidence, reflection].some(value => value.length > 2000)) {
        setSubmitMessage("Cada respuesta debe tener un máximo de 2.000 caracteres.", "error");
        return null;
      }

      return {
        email,
        name,
        barrier,
        change,
        evidence,
        reflection,
        website: $("#website").value
      };
    }

    function lockCompletedForm(message) {
      ["#participantEmail", "#participantName", "#barrierSelect", "#changeInput", "#evidenceInput", "#reflectionInput"].forEach(selector => {
        $(selector).disabled = true;
      });
      $("#sendBtn").disabled = true;
      $("#sendBtn").textContent = "Participación registrada ✓";
      $("#completionNotice").hidden = false;
      $("#completionNotice").textContent = message;
    }

    const successModal = $("#successModal");
    const closeSuccessModal = $("#closeSuccessModal");

    function openSuccessModal() {
      if (typeof successModal.showModal === "function") {
        successModal.showModal();
      } else {
        successModal.setAttribute("open", "");
        closeSuccessModal.focus();
      }
    }

    closeSuccessModal.addEventListener("click", () => {
      if (typeof successModal.close === "function") {
        successModal.close();
      } else {
        successModal.removeAttribute("open");
      }
    });

    function verifySheetSubmission(requestId) {
      return new Promise(resolve => {
        const callbackName = `misionAulaCallback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const script = document.createElement("script");
        let finished = false;
        const timeoutId = setTimeout(() => finish("unverified"), 12000);

        function finish(status) {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);
          delete window[callbackName];
          script.remove();
          resolve(status);
        }

        window[callbackName] = result => finish(result && result.status ? result.status : "unverified");
        script.onerror = () => finish("unverified");
        script.src = `${GOOGLE_APPS_SCRIPT_URL}?check=${encodeURIComponent(requestId)}&callback=${callbackName}`;
        document.body.appendChild(script);
      });
    }

    $("#sendBtn").addEventListener("click", async () => {
      const payload = validateFinalAnswers();
      if (!payload) return;

      const button = $("#sendBtn");
      const requestId = `aula-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      button.disabled = true;
      button.textContent = "Guardando...";
      setSubmitMessage("Estamos guardando tus respuestas en la planilla y registrando tu participación única. No cierres esta página todavía.");

      try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ ...payload, requestId })
        });

        const status = await verifySheetSubmission(requestId);
        if (status === "saved") {
          setSubmitMessage("¡Listo! Tus respuestas quedaron guardadas correctamente. Tu correo se utilizó únicamente para evitar duplicados.", "success");
          lockCompletedForm("¡Gracias por participar! Tu actividad quedó completada. Esta experiencia admite una sola participación por dirección de correo electrónico.");
          openSuccessModal();
        } else if (status === "duplicate") {
          setSubmitMessage("Este correo ya figura como participante. La actividad se completa una sola vez por dirección de correo electrónico.", "error");
          button.disabled = false;
          button.textContent = "Revisar registro";
        } else if (status === "error") {
          setSubmitMessage("No pudimos guardar las respuestas. Revisá tu conexión y volvé a intentar.", "error");
          button.disabled = false;
          button.textContent = "Reintentar registro";
        } else {
          setSubmitMessage("No pudimos confirmar el registro. Antes de volver a intentarlo, comprobá si el correo ya aparece en la planilla para evitar duplicados.", "error");
          button.disabled = false;
          button.textContent = "Volver a comprobar";
        }
      } catch (error) {
        setSubmitMessage("No pudimos conectar con Google Sheets. Revisá tu conexión e intentá nuevamente.", "error");
        button.disabled = false;
        button.textContent = "Reintentar registro";
      }
    });

    // No existe botón de reinicio: cada correo puede registrar una sola participación.
