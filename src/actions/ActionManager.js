import { VacancySelectionAction } from './VacancySelectionAction.js';
import { VacancyShowAction } from './VacancyShowAction.js';
import { ApplyToVacancyAction, VacancyDetailAction, VacancyBriefAction, CategoryAction, BackToCategoriesAction, BackToCategoryAction } from './VacancyActions.js';
import { ShowVacanciesAction, ShowAllVacanciesAction, BackToMainAction, ChangeVacancyAction, SendResumeAction, ShowHelpAction, MySubscriptionsAction } from './NavigationActions.js';
import { CancelApplyAction, ChangeResponseAction, CancelResponseAction, ConfirmCancelAction, KeepResponseAction } from './ResponseActions.js';

export class ActionManager {
  constructor() {
    this.actions = new Map();
    this.registerDefaultActions();
  }

  registerAction(action) {
    this.actions.set(action.actionPattern, action);
  }

  registerAll(bot) {
    for (const action of this.actions.values()) {
      action.register(bot);
    }
  }

  registerDefaultActions() {
    // Вакансии
    this.registerAction(new VacancySelectionAction());
    this.registerAction(new VacancyShowAction());
    this.registerAction(new ApplyToVacancyAction()); // ✨ Новый упрощенный flow отклика
    this.registerAction(new VacancyDetailAction());
    this.registerAction(new VacancyBriefAction());
    this.registerAction(new CategoryAction());
    this.registerAction(new BackToCategoriesAction());
    this.registerAction(new BackToCategoryAction());
    
    // Навигация
    this.registerAction(new ShowVacanciesAction());
    this.registerAction(new ShowAllVacanciesAction());
    this.registerAction(new BackToMainAction());
    this.registerAction(new ChangeVacancyAction());
    this.registerAction(new SendResumeAction());
    this.registerAction(new ShowHelpAction()); // ✨ Справка как действие
    this.registerAction(new MySubscriptionsAction()); // ✨ Мои подписки как действие
    
    // Отклики
    this.registerAction(new CancelApplyAction()); // ✨ Новая простая отмена
    this.registerAction(new ChangeResponseAction());
    this.registerAction(new CancelResponseAction());
    this.registerAction(new ConfirmCancelAction());
    this.registerAction(new KeepResponseAction());
    
    // ✅ Опросы теперь только через WebApp!
    // Старые действия удалены: StartSurveyAction, NewSurveyActions и т.д.
  }

  getAction(actionPattern) {
    return this.actions.get(actionPattern);
  }
}
